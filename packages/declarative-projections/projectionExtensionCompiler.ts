import { ProjectionRegistry, SubProjection } from "@puredit/projections";
import {
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
import ChainDecorator from "@puredit/parser/pattern/decorators/chainDecorator";
import ChainLinkTemplateTransformer from "@puredit/parser/parse/chainLinkTemplateTransformer";
import TemplateParameter from "@puredit/parser/template/parameters/templateParameter";
import AggregationDecorator from "@puredit/parser/pattern/decorators/aggregationDecorator";
import AggPartTemplateTransformer from "@puredit/parser/parse/aggPartTemplateTransformer";
import { loadAggregatableNodeTypeConfigFor } from "@puredit/language-config";
import CodeString from "@puredit/parser/template/codeString";
import {
  ALLOWED_PARAMETER_TYPES,
  ALLOWED_SUBPROJECTION_TYPES,
  buildParserInput,
  buildWidget,
} from "./common";

export default class ProjectionExtensionCompiler {
  constructor(
    private readonly parser: Parser,
    private readonly projectionRegistry: ProjectionRegistry
  ) {}

  compile(extension: RootProjectionExtension | SubProjectionExtension) {
    let subProjection: SubProjection, pattern: Pattern, subProjectionsBelow: SubProjection[];
    for (const definition of extension.subProjections) {
      switch (definition.type) {
        case "chainLink":
          ({ subProjection, pattern, subProjectionsBelow } = this.processChainLink(
            extension,
            definition
          ));
          this.projectionRegistry.insertChainLink(
            extension.package,
            extension.rootProjection,
            extension.parentParameter,
            subProjection,
            pattern,
            subProjectionsBelow
          );
          break;
        case "aggregationPart":
          ({ subProjection, pattern, subProjectionsBelow } = this.processAggregationPart(
            extension,
            definition
          ));
          this.projectionRegistry.insertAggregationPart(
            extension.package,
            extension.rootProjection,
            extension.parentParameter,
            subProjection,
            pattern,
            subProjectionsBelow
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
    definition: SubProjectionDefinition
  ) {
    const { newSubProjection, subProjectionsBelow } = this.buildSubProjection(definition);
    let pattern: Pattern;
    if (extension.type === "rootProjectionExtension") {
      const rootProjectionExtension = extension as RootProjectionExtension;
      pattern = this.buildAggregationPartPattern(
        newSubProjection,
        rootProjectionExtension.package,
        rootProjectionExtension.rootProjection,
        rootProjectionExtension.parentParameter
      );
    } else {
      const subProjectionExtension = extension as SubProjectionExtension;
      pattern = this.buildAggregationPartPattern(
        newSubProjection,
        subProjectionExtension.package,
        subProjectionExtension.subProjection,
        subProjectionExtension.parentParameter
      );
    }
    return { subProjection: newSubProjection, pattern, subProjectionsBelow };
  }

  private processChainLink(
    extension: RootProjectionExtension | SubProjectionExtension,
    definition: SubProjectionDefinition
  ) {
    const { newSubProjection, subProjectionsBelow } = this.buildSubProjection(definition);
    let pattern: Pattern;
    if (extension.type === "rootProjectionExtension") {
      const rootProjectionExtension = extension as RootProjectionExtension;
      pattern = this.buildChainLinkPattern(
        newSubProjection,
        rootProjectionExtension.package,
        rootProjectionExtension.rootProjection,
        rootProjectionExtension.parentParameter
      );
    } else {
      const subProjectionExtension = extension as SubProjectionExtension;
      pattern = this.buildChainLinkPattern(
        newSubProjection,
        subProjectionExtension.package,
        subProjectionExtension.subProjection,
        subProjectionExtension.parentParameter
      );
    }
    return { subProjection: newSubProjection, pattern, subProjectionsBelow };
  }

  private buildSubProjection(definition: SubProjectionDefinition) {
    const technicalName = definition.name;
    const { paramsMap, subProjections } = this.buildParams(definition);
    const { templateStrings, params } = buildParserInput(definition, paramsMap);

    const template = this.parser.subPattern(`${technicalName}`)(
      templateStrings as unknown as TemplateStringsArray,
      ...params
    );

    const segmentWidgets = definition.segmentWidgets.map((widget) =>
      buildWidget(widget, paramsMap)
    );

    const newSubProjection = {
      template,
      description: definition.description,
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
            partTemplates.push(newSubProjection.template);
            subProjections.push(newSubProjection, ...subProjectionsBelow);
          }
          let aggregationStartTemplate: Template | undefined;
          if (aggDefinition.startSubProjection) {
            const { newSubProjection, subProjectionsBelow } = this.buildSubProjection(
              aggDefinition.startSubProjection
            );
            aggregationStartTemplate = newSubProjection.template;
            subProjections.push(newSubProjection, ...subProjectionsBelow);
          }
          param = agg(
            aggDefinition.name,
            aggDefinition.nodeType,
            partTemplates,
            aggregationStartTemplate
          );
          break;
        case "chain":
          const chainDefinition = paramDefinition as TemplateChainDefinition;
          const linkTemplates: Template[] = [];
          for (const linkDefinition of chainDefinition.linkSubProjections) {
            const { newSubProjection, subProjectionsBelow } =
              this.buildSubProjection(linkDefinition);
            linkTemplates.push(newSubProjection.template);
            subProjections.push(newSubProjection, ...subProjectionsBelow);
          }

          const { newSubProjection, subProjectionsBelow } = this.buildSubProjection(
            chainDefinition.startSubProjection
          );
          const chainStartTemplate = newSubProjection.template;
          subProjections.push(newSubProjection, ...subProjectionsBelow);

          param = chain(
            chainDefinition.name,
            chainStartTemplate,
            linkTemplates,
            chainDefinition.minimumLength
          );
          break;
        default:
          throw new Error(
            `Invalid template parameter type ${paramDefinition.type} in template parameter ${definition.name}. Allowed values are ${ALLOWED_PARAMETER_TYPES}`
          );
      }
      paramsMap[`<%${paramDefinition.name}%>`] = param;
    }

    return { paramsMap, subProjections };
  }

  private buildChainLinkPattern(
    subProjection: SubProjection,
    packageName: string,
    parentProjectionName: string,
    parentParameter: string
  ): Pattern {
    const parentPattern = this.projectionRegistry.getPatternBy(
      packageName,
      parentProjectionName
    ) as ChainDecorator;
    const transformation = new ChainLinkTemplateTransformer(this.parser);
    return transformation
      .setStartPatternRootNode(parentPattern.getStartPatternFor(parentParameter).rootNode)
      .setIsExpression(false)
      .setTemplate(subProjection.template)
      .execute();
  }

  private buildAggregationPartPattern(
    subProjection: SubProjection,
    packageName: string,
    parentProjectionName: string,
    parentParameter: string
  ): Pattern {
    const parentPattern = this.projectionRegistry.getPatternBy(
      packageName,
      parentProjectionName
    ) as AggregationDecorator;
    const aggregatedNodeType = parentPattern.getNodeTypeFor(parentParameter);
    if (!aggregatedNodeType) {
      throw new Error(
        `Aggregation ${parentParameter} not found. Was referenced in subprojection definition ${subProjection.template.name}`
      );
    }
    const nodeTypeConfig = loadAggregatableNodeTypeConfigFor(
      this.parser.language,
      aggregatedNodeType
    );
    const transformation = new AggPartTemplateTransformer(this.parser);
    transformation;
    if (nodeTypeConfig.specialStartPattern) {
      transformation.setStartTemplateCodeString(new CodeString("a"));
    }
    return transformation
      .setNodeTypeConfig(nodeTypeConfig)
      .setIsExpression(false)
      .setTemplate(subProjection.template)
      .execute();
  }
}
