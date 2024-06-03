import { ProjectionRegistry, RootProjection, SubProjection } from "@puredit/projections";
import {
  PackageExtension,
  RootProjectionDefinition,
  SubProjectionDefinition,
  TemplateAggregationDefinition,
  TemplateArgumentDefinition,
  TemplateChainDefinition,
  TemplateContextVariableDefinition,
} from "./types";
import { agg, arg, chain, contextVariable, Parser, Pattern, Template } from "@puredit/parser";
import TemplateParameter from "@puredit/parser/template/parameters/templateParameter";
import { ALLOWED_PARAMETER_TYPES, buildParserInput, buildWidget } from "./common";

export default class PackageExtensionCompiler {
  constructor(
    private readonly parser: Parser,
    private readonly projectionRegistry: ProjectionRegistry
  ) {}

  compile(extension: PackageExtension) {
    for (const definition of extension.rootProjections) {
      const rootProjection = this.buildRootProjection(definition);
      this.projectionRegistry.insertRootProjection(extension.package, rootProjection);
    }
  }

  private buildRootProjection(definition: RootProjectionDefinition): RootProjection {
    const { paramsMap, subProjections } = this.buildParams(definition);
    const { templateStrings, params } = buildParserInput(definition, paramsMap);

    let pattern: Pattern;
    if (definition.isExpression) {
      pattern = this.parser.expressionPattern(definition.name)(
        templateStrings as unknown as TemplateStringsArray,
        ...params
      );
    } else {
      pattern = this.parser.statementPattern(definition.name)(
        templateStrings as unknown as TemplateStringsArray,
        ...params
      );
    }

    const segmentWidgets = definition.segmentWidgets.map((widget) =>
      buildWidget(widget, paramsMap)
    );

    return {
      pattern,
      description: definition.description,
      segmentWidgets,
      requiredContextVariables: [],
      subProjections,
    };
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
          let aggregationStartTemplate: Template | undefined = undefined;
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
        case "parameterName":
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
}
