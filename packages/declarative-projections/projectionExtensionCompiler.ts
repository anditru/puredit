import { ProjectionRegistry, SubProjection } from "@puredit/projections";
import {
  ProjectionExtension,
  NewSubProjectionDefinition,
  AggregationPartReferenceDefinition,
} from "./types";
import { Parser, Pattern, reference } from "@puredit/parser";
import ChainDecorator from "@puredit/parser/pattern/decorators/chainDecorator";
import ChainLinkTemplateTransformer from "@puredit/parser/parse/chainLinkTemplateTransformer";
import AggregationDecorator from "@puredit/parser/pattern/decorators/aggregationDecorator";
import AggPartTemplateTransformer from "@puredit/parser/parse/aggPartTemplateTransformer";
import { loadAggregatableNodeTypeConfigFor } from "@puredit/language-config";
import CodeString from "@puredit/parser/template/codeString";
import { ALLOWED_SUBPROJECTION_TYPES } from "./common";
import ExtensionCompiler from "./extensionCompiler";
import ReferencePattern from "@puredit/parser/pattern/referencePattern";

export default class ProjectionExtensionCompiler extends ExtensionCompiler {
  constructor(parser: Parser, private readonly projectionRegistry: ProjectionRegistry) {
    super(parser);
  }

  compile(extension: ProjectionExtension) {
    let subProjection: SubProjection, pattern: Pattern, subProjectionsBelow: SubProjection[];
    for (const definition of extension.subProjections) {
      switch (definition.type) {
        case "chainLink":
          ({ subProjection, pattern, subProjectionsBelow } = this.processChainLink(
            extension,
            definition as NewSubProjectionDefinition
          ));
          this.projectionRegistry.insertChainLink(
            extension.package,
            extension.parentProjection,
            extension.parentParameter,
            subProjection,
            pattern,
            subProjectionsBelow
          );
          break;
        case "aggregationPart":
          ({ subProjection, pattern, subProjectionsBelow } = this.processAggregationPart(
            extension,
            definition as NewSubProjectionDefinition
          ));
          this.projectionRegistry.insertAggregationPart(
            extension.package,
            extension.parentProjection,
            extension.parentParameter,
            subProjection,
            pattern,
            subProjectionsBelow
          );
          break;
        case "aggregationPartReference":
          const aggPartReferenceDefinition = definition as AggregationPartReferenceDefinition;
          const referenceTemplate = reference(aggPartReferenceDefinition.referencedProjection);
          const referencePattern = referenceTemplate.toPattern() as ReferencePattern;
          this.projectionRegistry.insertAggregationPartReference(
            extension.package,
            extension.parentProjection,
            extension.parentParameter,
            referencePattern
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
    extension: ProjectionExtension,
    definition: NewSubProjectionDefinition
  ) {
    const { newSubProjection, subProjectionsBelow } = this.buildSubProjection(definition);
    const pattern = this.buildAggregationPartPattern(
      newSubProjection,
      extension.package,
      extension.parentProjection,
      extension.parentParameter
    );
    return { subProjection: newSubProjection, pattern, subProjectionsBelow };
  }

  private processChainLink(extension: ProjectionExtension, definition: NewSubProjectionDefinition) {
    const { newSubProjection, subProjectionsBelow } = this.buildSubProjection(definition);
    let pattern: Pattern;
    if (extension.type === "rootProjectionExtension") {
      const rootProjectionExtension = extension as ProjectionExtension;
      pattern = this.buildChainLinkPattern(
        newSubProjection,
        rootProjectionExtension.package,
        rootProjectionExtension.parentProjection,
        rootProjectionExtension.parentParameter
      );
    } else {
      const subProjectionExtension = extension as ProjectionExtension;
      pattern = this.buildChainLinkPattern(
        newSubProjection,
        subProjectionExtension.package,
        subProjectionExtension.parentProjection,
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
    if (nodeTypeConfig.hasStartPattern) {
      transformation.setStartTemplateCodeString(new CodeString("a"));
    }
    return transformation
      .setNodeTypeConfig(nodeTypeConfig)
      .setIsExpression(false)
      .setTemplate(subProjection.template)
      .execute();
  }
}
