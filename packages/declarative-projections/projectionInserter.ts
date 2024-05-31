import { RootProjection, SubProjection } from "@puredit/projections";
import {
  Extension,
  PackageExtension,
  RootProjectionDefinition,
  RootProjectionExtension,
  SubProjectionDefinition,
  SubProjectionExtension,
  TemplateAggregationDefinition,
  TemplateArgumentDefinition,
  TemplateChainDefinition,
  TemplateContextVariableDefinition,
} from "./types";
import { agg, arg, chain, contextVariable, Parser, Pattern, Template } from "@puredit/parser";
import { simpleProjection } from "@puredit/simple-projection";
import ChainDecorator from "@puredit/parser/pattern/decorators/chainDecorator";
import ChainLinkTemplateTransformation from "@puredit/parser/parse/chainLinkTemplateTransformation";
import TemplateParameter from "@puredit/parser/template/parameters/templateParameter";
import TemplatePartArray from "./templatePartArray";
import { toLowerCamelCase } from "@puredit/utils-shared";
import AggregationDecorator from "@puredit/parser/pattern/decorators/aggregationDecorator";
import AggPartTemplateTransformation from "@puredit/parser/parse/aggPartTemplateTransformation";
import { loadAggregatableNodeTypeConfigFor } from "@puredit/language-config";

type ParamsMap = Record<string, TemplateParameter>;

const PLACEHOLDER_PATTERN = /<%[^%>]+%>/g;

const ALLOWED_EXTENSION_TYPES = [
  "packageExtension",
  "rootProjectionExtension",
  "subProjectionExtension",
].join(", ");

const ALLOWED_SUBPROJECTION_TYPES = ["chainLink", "aggregationPart"].join(", ");

const ALLOWED_PARAMETER_TYPES = ["argument", "contextVariable", "aggregation", "chain"].join(", ");

export class ProjectionInserter {
  projections: Record<string, RootProjection[]>;
  constructor(private readonly parser: Parser) {}

  insertProjections(extensions: Extension[], projections: Record<string, RootProjection[]>) {
    this.projections = projections;
    for (const extension of extensions) {
      switch (extension.type) {
        case "packageExtension":
          this.processPackageExtension(extension as PackageExtension);
          break;
        case "rootProjectionExtension":
          this.processRootProjectionExtension(extension as RootProjectionExtension);
          break;
        case "subProjectionExtension":
          this.processSubProjectionExtension(extension as SubProjectionExtension);
          break;
        default:
          throw new Error(
            `Invalid extension type ${extension.type}! Allowed values are ${ALLOWED_EXTENSION_TYPES}.`
          );
      }
    }
    return this.projections;
  }

  private processPackageExtension(extension: PackageExtension) {
    if (!this.projections[extension.package]) {
      return;
    }
    for (const definition of extension.rootProjections) {
      const rootProjection = this.buildRootProjection(definition);
      this.projections[extension.package].push(rootProjection);
    }
  }

  private buildRootProjection(definition: RootProjectionDefinition): RootProjection {
    const technicalName = toLowerCamelCase(definition.name);
    const { paramsMap, subProjections } = this.buildParams(definition);
    const { templateStrings, params } = buildParserInput(definition, paramsMap);

    let pattern: Pattern;
    if (definition.isExpression) {
      pattern = this.parser.expressionPattern(`${technicalName}Pattern`)(
        templateStrings as unknown as TemplateStringsArray,
        ...params
      );
    } else {
      pattern = this.parser.statementPattern(`${technicalName}Pattern`)(
        templateStrings as unknown as TemplateStringsArray,
        ...params
      );
    }

    const segmentWidgets = definition.segmentWidgets.map((widget) =>
      buildWidget(widget, paramsMap)
    );

    return {
      name: definition.name,
      description: definition.description,
      pattern,
      segmentWidgets,
      requiredContextVariables: [],
      subProjections,
    };
  }

  private processRootProjectionExtension(extension: RootProjectionExtension) {
    let subProjection: SubProjection, pattern: Pattern, subProjectionsBelow: SubProjection[];
    const parentProjection = this.getParentProjectionFor(extension) as RootProjection;
    if (!parentProjection) {
      return;
    }
    for (const definition of extension.subProjections) {
      switch (definition.type) {
        case "chainLink":
          ({ subProjection, pattern, subProjectionsBelow } = this.processChainLink(
            extension,
            definition,
            parentProjection
          ));
          insertChainLinkIntoProjection(
            subProjection,
            pattern,
            subProjectionsBelow,
            parentProjection,
            extension.parentParameter
          );
          break;
        case "aggregationPart":
          ({ subProjection, pattern, subProjectionsBelow } = this.processAggregationPart(
            extension,
            definition,
            parentProjection
          ));
          insertAggregationPartIntoProjection(
            subProjection,
            pattern,
            subProjectionsBelow,
            parentProjection,
            extension.parentParameter
          );
          break;
        default:
          throw new Error(
            `Invalid subprojection type ${definition.type}! Allowed values are ${ALLOWED_SUBPROJECTION_TYPES}.`
          );
      }
    }
  }

  private processSubProjectionExtension(extension: SubProjectionExtension) {
    let subProjection: SubProjection, pattern: Pattern, subProjectionsBelow: SubProjection[];
    const rootProjection = this.getRootProjection(extension);
    if (!rootProjection) {
      return;
    }
    const parentSubProjection = this.getParentProjectionFor(extension) as SubProjection;
    for (const definition of extension.subProjections) {
      switch (definition.type) {
        case "chainLink":
          ({ subProjection, pattern, subProjectionsBelow } = this.processChainLink(
            extension,
            definition,
            parentSubProjection
          ));
          insertChainLinkIntoSubProjection(
            subProjection,
            pattern,
            subProjectionsBelow,
            rootProjection,
            parentSubProjection,
            extension.parentParameter
          );
          break;
        case "aggregationPart":
          ({ subProjection, pattern, subProjectionsBelow } = this.processAggregationPart(
            extension,
            definition,
            parentSubProjection
          ));
          insertAggregationPartIntoSubProjection(
            subProjection,
            pattern,
            subProjectionsBelow,
            rootProjection,
            parentSubProjection,
            extension.parentParameter
          );
          break;
        default:
          throw new Error(
            `Invalid subprojection type ${definition.type}! Allowed values are ${ALLOWED_SUBPROJECTION_TYPES}.`
          );
      }
    }
  }

  private processAggregationPart(
    extension: RootProjectionExtension | SubProjectionExtension,
    definition: SubProjectionDefinition,
    parentProjection: RootProjection | SubProjection
  ) {
    const { newSubProjection, subProjectionsBelow } = this.buildSubProjection(definition);
    const pattern = this.buildAggregationPartPattern(
      newSubProjection,
      parentProjection,
      extension.parentParameter
    );
    return { subProjection: newSubProjection, pattern, subProjectionsBelow };
  }

  private processChainLink(
    extension: RootProjectionExtension | SubProjectionExtension,
    definition: SubProjectionDefinition,
    parentProjection: RootProjection | SubProjection
  ) {
    const { newSubProjection, subProjectionsBelow } = this.buildSubProjection(definition);
    const pattern = this.buildChainLinkPattern(
      newSubProjection,
      parentProjection,
      extension.parentParameter
    );
    return { subProjection: newSubProjection, pattern, subProjectionsBelow };
  }

  private buildSubProjection(definition: SubProjectionDefinition) {
    const technicalName = toLowerCamelCase(definition.name);
    const { paramsMap, subProjections } = this.buildParams(definition);
    const { templateStrings, params } = buildParserInput(definition, paramsMap);

    const template = this.parser.subPattern(`${technicalName}Pattern`)(
      templateStrings as unknown as TemplateStringsArray,
      ...params
    );

    const segmentWidgets = definition.segmentWidgets.map((widget) =>
      buildWidget(widget, paramsMap)
    );

    const newSubProjection = {
      name: definition.name,
      description: definition.description,
      pattern: template,
      segmentWidgets,
      requiredContextVariables: [],
    };

    return { newSubProjection, subProjectionsBelow: subProjections };
  }

  private buildParams(definition: RootProjectionDefinition | SubProjectionDefinition) {
    const paramsMap: Record<string, TemplateParameter> = {};
    const subProjections: SubProjection[] = [];

    for (const paramDefinition of definition.parameters) {
      let param: TemplateParameter;
      switch (paramDefinition.type) {
        case "argument":
          const argDefinition = paramDefinition as TemplateArgumentDefinition;
          param = arg(argDefinition.name, argDefinition.nodeTypes);
          break;
        case "contextVariable":
          const varDefinition = paramDefinition as TemplateContextVariableDefinition;
          param = contextVariable(varDefinition.name);
          break;
        case "aggregation":
          const aggDefinition = paramDefinition as TemplateAggregationDefinition;
          const partTemplates: Template[] = [];
          for (const partDefinition of aggDefinition.partSubProjections) {
            const { newSubProjection, subProjectionsBelow } =
              this.buildSubProjection(partDefinition);
            partTemplates.push(newSubProjection.pattern);
            subProjections.push(newSubProjection, ...subProjectionsBelow);
          }
          let speficalStartTemplate: Template | undefined = undefined;
          if (aggDefinition.startSubProjection) {
            const { newSubProjection, subProjectionsBelow } = this.buildSubProjection(
              aggDefinition.startSubProjection
            );
            speficalStartTemplate = newSubProjection.pattern;
            subProjections.push(newSubProjection, ...subProjectionsBelow);
          }
          param = agg(
            aggDefinition.name,
            aggDefinition.nodeType,
            partTemplates,
            speficalStartTemplate
          );
          break;
        case "parameterName":
          const chainDefinition = paramDefinition as TemplateChainDefinition;
          const linkTemplates: Template[] = [];
          for (const linkDefinition of chainDefinition.linkSubProjections) {
            const { newSubProjection, subProjectionsBelow } =
              this.buildSubProjection(linkDefinition);
            linkTemplates.push(newSubProjection.pattern);
            subProjections.push(newSubProjection, ...subProjectionsBelow);
          }

          const { newSubProjection, subProjectionsBelow } = this.buildSubProjection(
            chainDefinition.startSubProjection
          );
          const startTemplate = newSubProjection.pattern;
          subProjections.push(newSubProjection, ...subProjectionsBelow);

          param = chain(
            chainDefinition.name,
            startTemplate,
            linkTemplates,
            chainDefinition.minimumLength
          );
          break;
        default:
          throw new Error(
            `Invalid template parameter type ${paramDefinition.type}. Allowed values are ${ALLOWED_PARAMETER_TYPES}`
          );
      }
      paramsMap[`<%${paramDefinition.name}%>`] = param;
    }

    return { paramsMap, subProjections };
  }

  private buildChainLinkPattern(
    subProjection: SubProjection,
    parentProjection: RootProjection | SubProjection,
    parentParameter: string
  ): Pattern {
    let parentPattern: ChainDecorator;
    if (parentProjection.pattern instanceof Template) {
      parentPattern = parentProjection.pattern.getPatterns()[0] as ChainDecorator;
    } else {
      parentPattern = parentProjection.pattern as ChainDecorator;
    }
    const chain = parentPattern.getChain(parentParameter);
    if (!chain) {
      throw new Error(`Chain with name ${parentParameter} not found`);
    }
    const transformation = new ChainLinkTemplateTransformation(this.parser.treeSitterParser);
    return transformation
      .setTemplateChain(chain)
      .setStartPatternRootNode(parentPattern.getStartPatternFor(parentParameter).rootNode)
      .setIsExpression(false)
      .setTemplate(subProjection.pattern)
      .execute();
  }

  private buildAggregationPartPattern(
    subProjection: SubProjection,
    parentProjection: RootProjection | SubProjection,
    parentParameter: string
  ): Pattern {
    let parentPattern: AggregationDecorator;
    if (parentProjection.pattern instanceof Template) {
      parentPattern = parentProjection.pattern.getPatterns()[0] as AggregationDecorator;
    } else {
      parentPattern = parentProjection.pattern as AggregationDecorator;
    }
    const aggregation = parentPattern.getAggregation(parentParameter);
    if (!aggregation) {
      throw new Error(`Aggregation with name ${parentParameter} not found`);
    }
    const nodeTypeConfig = loadAggregatableNodeTypeConfigFor(
      this.parser.language,
      aggregation.type
    );
    const transformation = new AggPartTemplateTransformation(this.parser.treeSitterParser);
    transformation;
    if (aggregation.specialStartPattern) {
      transformation.setStartTemplateCodeString(aggregation.specialStartPattern?.toCodeString());
    }
    return transformation
      .setNodeTypeConfig(nodeTypeConfig)
      .setIsExpression(false)
      .setTemplate(subProjection.pattern)
      .execute();
  }

  private getRootProjection(extension: SubProjectionExtension) {
    if (!this.projections[extension.package]) {
      return null;
    }
    const rootProjection = this.projections[extension.package].find(
      (proj) => proj.name === extension.rootProjection
    );
    if (!rootProjection) {
      throw new Error(`Root projection ${extension.rootProjection} not found`);
    }
    return rootProjection;
  }

  private getParentProjectionFor(
    extension: RootProjectionExtension | SubProjectionExtension
  ): RootProjection | SubProjection | null {
    if (!this.projections[extension.package]) {
      return null;
    }
    const rootProjection = this.projections[extension.package].find(
      (proj) => proj.name === extension.rootProjection
    );
    if (!rootProjection) {
      throw new Error(`Root projection ${extension.rootProjection} not found`);
    }
    switch (extension.type) {
      case "rootProjectionExtension":
        return rootProjection;
      case "subProjectionExtension":
        const subProjectionExtension = extension as SubProjectionExtension;
        const subProjection = rootProjection.subProjections.find(
          (subProj) => subProj.name === subProjectionExtension.subProjection
        );
        if (!subProjection) {
          throw new Error(`Subprojection ${subProjectionExtension.subProjection} not found`);
        }
        return subProjection;
      default:
        throw new Error(
          `Invalid extension type ${extension.type}! Allowed values are ${ALLOWED_EXTENSION_TYPES}.`
        );
    }
  }
}

function buildParserInput(
  definition: RootProjectionDefinition | SubProjectionDefinition,
  paramsMap: ParamsMap
) {
  const patternStaticParts = definition.template.split(PLACEHOLDER_PATTERN);
  const patternParameters = definition.template.match(PLACEHOLDER_PATTERN) || [];
  const templateStrings = new TemplatePartArray(...patternStaticParts);
  const params = patternParameters.map((paramName) => {
    const param = paramsMap[paramName];
    if (!param) {
      throw new Error(`Error in template of ${definition.name}: Undefined parameter ${paramName}`);
    }
    return param;
  });
  return {
    templateStrings,
    params,
  };
}

function buildWidget(widgetString: string, paramsMap) {
  const projectionStaticParts = widgetString.split(PLACEHOLDER_PATTERN);
  const projectionParameters = widgetString.match(PLACEHOLDER_PATTERN) || [];
  const mergedParts = merge(projectionStaticParts, projectionParameters, paramsMap);
  return simpleProjection(mergedParts);
}

function insertChainLinkIntoProjection(
  newSubProjection: SubProjection,
  newLinkPattern: Pattern,
  subProjectionsBelow: SubProjection[],
  rootProjection: RootProjection,
  parentParameter: string
) {
  rootProjection.subProjections.push(newSubProjection, ...subProjectionsBelow);
  const rootPattern = rootProjection.pattern as ChainDecorator;
  const chain = rootPattern.getChain(parentParameter);
  if (!chain) {
    throw new Error(`Chain with name ${parentParameter} not found`);
  }
  chain.linkPatterns.push(newSubProjection.pattern);
  rootPattern.addLinkPattern(parentParameter, newLinkPattern);
}

function insertAggregationPartIntoProjection(
  newSubProjection: SubProjection,
  newPartPattern: Pattern,
  subProjectionsBelow: SubProjection[],
  rootProjection: RootProjection,
  parentParameter: string
) {
  rootProjection.subProjections.push(newSubProjection, ...subProjectionsBelow);
  const rootPattern = rootProjection.pattern as AggregationDecorator;
  const aggregation = rootPattern.getAggregation(parentParameter);
  if (!aggregation) {
    throw new Error(`Chain with name ${parentParameter} not found`);
  }
  aggregation.subPatterns.push(newSubProjection.pattern);
  rootPattern.addPartPattern(parentParameter, newPartPattern);
}

function insertChainLinkIntoSubProjection(
  newSubProjection: SubProjection,
  newPartPattern: Pattern,
  subProjectionsBelow: SubProjection[],
  rootProjection: RootProjection,
  parentSubProjection: SubProjection,
  parentParameter: string
) {
  rootProjection.subProjections.push(newSubProjection, ...subProjectionsBelow);
  const parentTemplate = parentSubProjection.pattern;
  const chain = parentTemplate.getChain(parentParameter);
  if (!chain) {
    throw new Error(`Aggregation with name ${parentParameter} not found`);
  }
  chain.linkPatterns.push(newSubProjection.pattern);
  const parentPatterns = parentTemplate.getPatterns() as ChainDecorator[];
  parentPatterns.forEach((pattern) => pattern.addLinkPattern(parentParameter, newPartPattern));
}

function insertAggregationPartIntoSubProjection(
  newSubProjection: SubProjection,
  newPartPattern: Pattern,
  subProjectionsBelow: SubProjection[],
  rootProjection: RootProjection,
  parentSubProjection: SubProjection,
  parentParameter: string
) {
  rootProjection.subProjections.push(newSubProjection, ...subProjectionsBelow);
  const parentTemplate = parentSubProjection.pattern;
  const aggregation = parentTemplate.getAggregation(parentParameter);
  if (!aggregation) {
    throw new Error(`Aggregation with name ${parentParameter} not found`);
  }
  aggregation.subPatterns.push(newSubProjection.pattern);
  const parentPatterns = parentTemplate.getPatterns() as AggregationDecorator[];
  parentPatterns.forEach((pattern) => pattern.addPartPattern(parentParameter, newPartPattern));
}

function merge(
  staticParts: string[],
  parameterNames: string[],
  paramsMap: Record<string, TemplateParameter>
) {
  const result: (string | TemplateParameter)[] = [];
  for (let i = 0; i < parameterNames.length; i++) {
    result.push(staticParts[i]);
    const parameterName = parameterNames[i];
    const parameter = paramsMap[parameterName];
    if (!parameter) {
      throw new Error(`Error in widget: Undefined parameter ${parameterName}`);
    }
    result.push(parameter);
  }
  result.push(staticParts[parameterNames.length]);
  return result.filter((part) => part !== "");
}
