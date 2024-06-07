import { SubProjection } from "@puredit/projections";
import {
  AggregationPartReferenceDefinition,
  NewSubProjectionDefinition,
  RootProjectionDefinition,
  TemplateAggregationDefinition,
  TemplateArgumentDefinition,
  TemplateChainDefinition,
  TemplateContextVariableDefinition,
} from "./types";
import { agg, arg, chain, contextVariable, Parser, reference, Template } from "@puredit/parser";
import TemplateParameter from "@puredit/parser/template/parameters/templateParameter";
import { ALLOWED_PARAMETER_TYPES, buildParserInput, buildWidget } from "./common";

export default abstract class ExtensionCompiler {
  constructor(protected readonly parser: Parser) {}

  private buildSubProjection(definition: NewSubProjectionDefinition) {
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

  protected buildParams(definition: RootProjectionDefinition | NewSubProjectionDefinition) {
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
            if (partDefinition.type === "aggregationPartReference") {
              const aggPartReferenceDefinition =
                partDefinition as AggregationPartReferenceDefinition;
              partTemplates.push(reference(aggPartReferenceDefinition.referencedProjection));
            } else {
              const newSubProjectionDefinition = partDefinition as NewSubProjectionDefinition;
              const { newSubProjection, subProjectionsBelow } = this.buildSubProjection(
                newSubProjectionDefinition
              );
              partTemplates.push(newSubProjection.template);
              subProjections.push(newSubProjection, ...subProjectionsBelow);
            }
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
}
