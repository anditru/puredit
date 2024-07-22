/**
 * @module
 * Implements functions to define template parameters.
 */

import TemplateAggregation from "./parameters/templateAggregation";
import TemplateArgument from "./parameters/templateArgument";
import TemplateBlock from "./parameters/templateBlock";
import TemplateContextVariable from "./parameters/templateContextVariable";
import { ReferenceTemplate, Template, TransformableTemplate } from "./template";
import TemplateChain from "./parameters/templateChain";
import { ContextVariableMap } from "@puredit/projections";

/**
 * Defines a TemplateArgument
 * @param name Name of the Argument
 * @param type Type of the Argument
 * @returns TemplateArgument
 */
export function arg(name: string, types: string[]): TemplateArgument {
  return new TemplateArgument(name, types);
}

/**
 * Defines a TeamplateAggregation
 * @param name Name of the Aggregation
 * @param partTemplates Allowed patterns in the Aggregation
 * @param context Context Variables required in the Aggregation
 * @returns TeamplateAggregation
 */
export function agg(
  name: string,
  type: string,
  partTemplates: Template[],
  startTemplate?: TransformableTemplate,
  contextVariables: ContextVariableMap = {}
): TemplateAggregation {
  return new TemplateAggregation(name, type, partTemplates, startTemplate, contextVariables);
}

/**
 * Defines a TeamplateChain
 * @param name Name of the Chain
 * @param basePattern Base of the Chain
 * @param subPatterns Allowed function in the Chain
 * @param context Context Variables required in the Chain
 * @returns TeamplateChain
 */
export function chain(
  name: string,
  startTemplate: TransformableTemplate,
  linkTemplates: TransformableTemplate[],
  minimumLength = 2,
  contextVariables: ContextVariableMap = {}
): TemplateChain {
  return new TemplateChain(name, startTemplate, linkTemplates, minimumLength, contextVariables);
}

/**
 * Defines a TemplateBlock
 * @param context Context Variables required in the Block
 * @returns TemplateBlock
 */
export function block(contextVariables: ContextVariableMap = {}): TemplateBlock {
  return new TemplateBlock(contextVariables);
}

/**
 * Defines a TemplateContextVariable
 * @param name Name of the Context Variable
 * @returns TemplateContextVariable
 */
export function contextVariable(name: string): TemplateContextVariable {
  return new TemplateContextVariable(name);
}

/**
 * Defines a reference to another template
 * @param templateName Name of the template to reference
 * @returns ReferenceTemplate
 */
export function reference(templateName: string): ReferenceTemplate {
  return new ReferenceTemplate(templateName);
}
