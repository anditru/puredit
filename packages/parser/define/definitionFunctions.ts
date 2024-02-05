/**
 * @module definitionFunctions
 * Implements functions to define template parameters.
 */

import { Context } from "../match/types";
import TemplateAggregation, { AggregationCardinality } from "./templateAggregation";
import TemplateArgument from "./templateArgument";
import TemplateBlock from "./templateBlock";
import TemplateContextVariable from "./templateContextVariable";
import RawTemplate from "./rawTemplate";

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
 * @param subPatterns Allowed patterns in the aggregation
 * @param cardinality Cardinality of the aggregation
 * @param context Context Variables required in the Block
 * @returns TeamplateAggregation
 */
export function agg(
  name: string,
  subPatterns: RawTemplate[],
  cardinality: AggregationCardinality,
  context: Context = {}
): TemplateAggregation {
  return new TemplateAggregation(name, subPatterns, cardinality, context);
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
