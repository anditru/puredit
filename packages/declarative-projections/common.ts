import { RootProjectionDefinition, SubProjectionDefinition } from "./types";
import { TemplateArgument } from "@puredit/parser";
import { simpleProjection } from "@puredit/projections";
import TemplateParameter from "@puredit/parser/template/parameters/templateParameter";
import TemplatePartArray from "./templatePartArray";

export const PLACEHOLDER_PATTERN = /<%[^%>]+%>/g;
export const ALLOWED_EXTENSION_TYPES = ["packageExtension", "rootProjectionExtension"].join(", ");
export const ALLOWED_SUBPROJECTION_TYPES = ["chainLink", "aggregationPart"].join(", ");
export const ALLOWED_PARAMETER_TYPES = ["argument", "contextVariable", "aggregation", "chain"].join(
  ", "
);

export type ParamsMap = Record<string, TemplateParameter>;

export function buildParserInput(
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

export function buildWidget(widgetString: string, paramsMap: Record<string, TemplateParameter>) {
  const projectionStaticParts = widgetString.split(PLACEHOLDER_PATTERN);
  const projectionParameters = widgetString.match(PLACEHOLDER_PATTERN) || [];
  const mergedParts = merge(projectionStaticParts, projectionParameters, paramsMap);
  return simpleProjection(mergedParts);
}

export function merge(
  staticParts: string[],
  argumentNames: string[],
  paramsMap: Record<string, TemplateParameter>
) {
  const result: (string | TemplateArgument)[] = [];
  for (let i = 0; i < argumentNames.length; i++) {
    result.push(staticParts[i]);
    const parameterName = argumentNames[i];
    const parameter = paramsMap[parameterName] as TemplateArgument;
    if (!parameter) {
      throw new Error(`Error in widget: Undefined parameter ${parameterName}`);
    }
    result.push(parameter);
  }
  result.push(staticParts[argumentNames.length]);
  return result.filter((part) => part !== "");
}
