import { ProjectionRegistry, SubProjection } from "@puredit/projections";
import { RootProjectionExtension, SubProjectionDefinition, SubProjectionExtension } from "./types";
import { Parser, Pattern } from "@puredit/parser";
import ChainDecorator from "@puredit/parser/pattern/decorators/chainDecorator";
import ChainLinkTemplateTransformer from "@puredit/parser/parse/chainLinkTemplateTransformer";
import AggregationDecorator from "@puredit/parser/pattern/decorators/aggregationDecorator";
import AggPartTemplateTransformer from "@puredit/parser/parse/aggPartTemplateTransformer";
import { loadAggregatableNodeTypeConfigFor } from "@puredit/language-config";
import CodeString from "@puredit/parser/template/codeString";
import { ALLOWED_SUBPROJECTION_TYPES } from "./common";
import ExtensionCompiler from "./extensionCompiler";

export default class ProjectionExtensionCompiler extends ExtensionCompiler {
  constructor(parser: Parser, private readonly projectionRegistry: ProjectionRegistry) {
    super(parser);
  }

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
