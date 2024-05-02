import { RootProjection, SubProjection } from "@puredit/projections";
import {
  Extension,
  ProjectionExtension,
  SubProjectionDefinition,
  SubProjectionExtension,
} from "./types";
import { arg, Parser, Pattern } from "@puredit/parser";
import { simpleProjection } from "@puredit/simple-projection";
import ChainDecorator from "@puredit/parser/pattern/decorators/chainDecorator";
import ChainLinkTemplateTransformation from "@puredit/parser/parse/chainLinkTemplateTransformation";
import TemplateParameter from "@puredit/parser/template/parameters/templateParameter";
import TemplatePartArray from "./templatePartArray";
import { toLowerCamelCase } from "@puredit/utils";
import AggregationDecorator from "@puredit/parser/pattern/decorators/aggregationDecorator";
import AggPartTemplateTransformation from "@puredit/parser/parse/aggPartTemplateTransformation";
import { loadAggregatableNodeTypeConfigFor } from "@puredit/language-config";

const PLACEHOLDER_PATTERN = /<%[^%>]+%>/g;
const ALLOWED_EXTENSION_TYPES = ["projectionExtension", "subProjectionExtension"].join(", ");
const ALLOWED_SUBPROJECTION_TYPES = ["chainLink, aggregationPart"].join(", ");

export class PackageExtender {
  pkg: RootProjection[];
  constructor(private readonly parser: Parser) {}

  extendPackage(pkg: RootProjection[], extensions: Extension[]) {
    this.pkg = pkg;
    for (const extension of extensions) {
      switch (extension.type) {
        case "projectionExtension":
          this.processProjectionExtension(extension as ProjectionExtension);
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
    return pkg;
  }

  private processProjectionExtension(extension: ProjectionExtension) {
    let subProjection: SubProjection, pattern: Pattern;
    const parentProjection = this.getParentProjectionFor(extension) as RootProjection;
    for (const definition of extension.subProjections) {
      switch (definition.type) {
        case "chainLink":
          ({ subProjection, pattern } = this.processChainLink(extension, definition));
          insertChainLinkIntoProjection(
            subProjection,
            pattern,
            parentProjection,
            extension.parentParameter
          );
          break;
        case "aggregationPart":
          ({ subProjection, pattern } = this.processAggregationPart(extension, definition));
          insertAggregationPartIntoProjection(
            subProjection,
            pattern,
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
    let subProjection: SubProjection, pattern: Pattern;
    const rootProjection = this.getRootProjection(extension);
    const parentSubProjection = this.getParentProjectionFor(extension) as SubProjection;
    for (const definition of extension.subProjections) {
      switch (definition.type) {
        case "aggregationPart":
          ({ subProjection, pattern } = this.processAggregationPart(extension, definition));
          insertAggregationPartIntoSubProjection(
            subProjection,
            pattern,
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
    extension: ProjectionExtension | SubProjectionExtension,
    definition: SubProjectionDefinition
  ) {
    const parentProjection = this.getParentProjectionFor(extension);
    const subProjection = this.buildSubProjection(definition);
    const pattern = this.buildAggregationPartPattern(
      subProjection,
      parentProjection,
      extension.parentParameter
    );
    return { subProjection, pattern };
  }

  private processChainLink(
    extension: ProjectionExtension | SubProjectionExtension,
    definition: SubProjectionDefinition
  ) {
    const parentProjection = this.getParentProjectionFor(extension);
    const subProjection = this.buildSubProjection(definition);
    const pattern = this.buildChainLinkPattern(
      subProjection,
      parentProjection,
      extension.parentParameter
    );
    return { subProjection, pattern };
  }

  private buildSubProjection(definition: SubProjectionDefinition): SubProjection {
    const technicalName = toLowerCamelCase(definition.name);
    const paramsMap: Record<string, TemplateParameter> = {};
    definition.arguments.map((definition) => {
      paramsMap[`<%${definition.name}%>`] = arg(definition.name, definition.types);
    });

    const patternStaticParts = definition.template.split(PLACEHOLDER_PATTERN);
    const patternParameters = definition.template.match(PLACEHOLDER_PATTERN) || [];
    const params = patternParameters.map((param) => paramsMap[param]);
    const templateStrings = new TemplatePartArray(...patternStaticParts);
    const template = this.parser.subPattern(`${technicalName}Pattern`)(
      templateStrings as unknown as TemplateStringsArray,
      ...params
    );

    const projectionStaticParts = definition.projection.split(PLACEHOLDER_PATTERN);
    const projectionParameters = definition.projection.match(PLACEHOLDER_PATTERN) || [];
    const mergedParts = merge(projectionStaticParts, projectionParameters, paramsMap);
    const widget = simpleProjection(mergedParts);
    return {
      name: definition.name,
      description: definition.description,
      pattern: template,
      segmentWidgets: [widget],
      requiredContextVariables: [],
    };
  }

  private buildChainLinkPattern(
    subProjection: SubProjection,
    rootProjection: RootProjection | SubProjection,
    parentParameter: string
  ): Pattern {
    const rootPattern = rootProjection.pattern as ChainDecorator;
    const chain = rootPattern.getChain(parentParameter);
    if (!chain) {
      throw new Error(`Chain with name ${parentParameter} not found`);
    }
    const transformation = new ChainLinkTemplateTransformation(this.parser.treeSitterParser);
    return transformation
      .setTemplateChain(chain)
      .setStartPatternRootNode(rootPattern.getStartPatternFor(parentParameter).rootNode)
      .setIsExpression(false)
      .setTemplate(subProjection.pattern)
      .execute();
  }

  private buildAggregationPartPattern(
    subProjection: SubProjection,
    parentProjection: RootProjection | SubProjection,
    parentParameter: string
  ): Pattern {
    const parentPattern = parentProjection.pattern as AggregationDecorator;
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
    const rootProjection = this.pkg.find((proj) => proj.name === extension.projection);
    if (!rootProjection) {
      throw new Error(`Root projection ${extension.projection} not found`);
    }
    return rootProjection;
  }

  private getParentProjectionFor(
    extension: ProjectionExtension | SubProjectionExtension
  ): RootProjection | SubProjection {
    const rootProjection = this.pkg.find((proj) => proj.name === extension.projection);
    if (!rootProjection) {
      throw new Error(`Root projection ${extension.projection} not found`);
    }
    switch (extension.type) {
      case "projectionExtension":
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

function insertChainLinkIntoProjection(
  newSubProjection: SubProjection,
  newLinkPattern: Pattern,
  rootProjection: RootProjection,
  parentParameter: string
) {
  rootProjection.subProjections.push(newSubProjection);
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
  rootProjection: RootProjection,
  parentParameter: string
) {
  rootProjection.subProjections.push(newSubProjection);
  const rootPattern = rootProjection.pattern as AggregationDecorator;
  const aggregation = rootPattern.getAggregation(parentParameter);
  if (!aggregation) {
    throw new Error(`Chain with name ${parentParameter} not found`);
  }
  aggregation.subPatterns.push(newSubProjection.pattern);
  rootPattern.addPartPattern(parentParameter, newPartPattern);
}

function insertAggregationPartIntoSubProjection(
  newSubProjection: SubProjection,
  newPartPattern: Pattern,
  rootProjection: RootProjection,
  parentSubProjection: SubProjection,
  parentParameter: string
) {
  rootProjection.subProjections.push(newSubProjection);
  const parentTemplate = parentSubProjection.pattern;
  const aggregation = parentTemplate.getAggregation(parentParameter);
  if (!aggregation) {
    throw new Error(`Aggregation with name ${parentParameter} not found`);
  }
  aggregation.subPatterns.push(newSubProjection.pattern);
  const parentPattern = parentTemplate.pattern! as AggregationDecorator;
  parentPattern.addPartPattern(parentParameter, newPartPattern);
}

function merge(
  staticParts: string[],
  parameters: string[],
  paramsMap: Record<string, TemplateParameter>
) {
  const result: (string | TemplateParameter)[] = [];
  for (let i = 0; i < parameters.length; i++) {
    result.push(staticParts[i]);
    result.push(paramsMap[parameters[i]]);
  }
  result.push(staticParts[parameters.length]);
  return result.filter((part) => part !== "");
}
