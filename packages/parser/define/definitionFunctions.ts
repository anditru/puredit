/**
 * @module define
 * Implements functions to define template parameters.
 */

import TemplateAggregation, { AggregationCardinality } from "./templateAggregation";
import { Context } from "../match/types";
import TemplateArgument from "./templateArgument";
import TemplateBlock from "./templateBlock";
import TemplateContextVariable from "./templateContextVariable";
import RawTemplate from "./rawTemplate";

/**
 * Defines an Argument active node
 * @param name Name of the Argument
 * @param type Type of the Argument
 * @returns Object representing the Argument
 */
export function arg(name: string, types: string[]): TemplateArgument {
  return new TemplateArgument(name, types);
}

/**
 * Defines a Aggregation active node
 * @param allowedPatterns Allowed patterns in the aggregation
 * @param cardinality Cardinality of the aggregation
 * @param context Context Variables required in the Block
 * @returns Object representing the Block
 */
export function agg(
  name: string,
  allowedPatterns: RawTemplate[],
  cardinality: AggregationCardinality,
  context: Context = {}
): TemplateAggregation {
  return new TemplateAggregation(name, allowedPatterns, cardinality, context);
}

/**
 * Defines a Block active node
 * @param context Context Variables required in the Block
 * @returns Object representing the Block
 */
export function block(context: Context = {}): TemplateBlock {
  return new TemplateBlock(context);
}

/**
 * Defines a Context Variable active node
 * @param name Name of the Context Variable
 * @returns Object representing the Context Variable
 */
export function contextVariable(name: string): TemplateContextVariable {
  return new TemplateContextVariable(name);
}
