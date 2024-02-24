/**
 * @module definitionFunctions
 * Implements functions to define template parameters.
 */

import { Context } from "../match/types";
import TemplateAggregation from "./parameters/templateAggregation";
import TemplateArgument from "./parameters/templateArgument";
import TemplateBlock from "./parameters/templateBlock";
import TemplateContextVariable from "./parameters/templateContextVariable";
import Template from "./template";
import TemplateChain from "./parameters/templateChain";

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
 * @param subPatterns Allowed patterns in the Aggregation
 * @param context Context Variables required in the Aggregation
 * @returns TeamplateAggregation
 */
export function agg(
  name: string,
  subPatterns: Template[],
  context: Context = {}
): TemplateAggregation {
  return new TemplateAggregation(name, subPatterns, context);
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
  startPattern: Template,
  linkPatterns: Template[],
  context: Context = {}
): TemplateChain {
  return new TemplateChain(name, startPattern, linkPatterns, context);
}

/**
 * Defines a TemplateBlock
 * @param context Context Variables required in the Block
 * @returns TemplateBlock
 */
export function block(context: Context = {}): TemplateBlock {
  return new TemplateBlock(context);
}

/**
 * Defines a TemplateContextVariable
 * @param name Name of the Context Variable
 * @returns TemplateContextVariable
 */
export function contextVariable(name: string): TemplateContextVariable {
  return new TemplateContextVariable(name);
}
