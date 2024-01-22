/**
 * @module define
 * Implements functions to define patterns with active nodes.
 */

import type {
  Context,
  TemplateArg,
  TemplateAgg,
  AggregationCardinality,
  TemplateBlock,
  TemplateContextVariable,
  AggPart,
} from "./types";
import { Target } from "./treeSitterParser";

/**
 * Defines an Argument active node
 * @param name Name of the Argument
 * @param type Type of the Argument
 * @returns Object representing the Argument
 */
export function arg(name: string, types: string[]): TemplateArg {
  return {
    kind: "arg",
    name,
    types,
  };
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
  allowedPatterns: AggPart[],
  cardinality: AggregationCardinality,
  separatorToken?: string,
  context: Context = {}
): TemplateAgg {
  return {
    kind: "agg",
    name,
    allowedPatterns,
    cardinality,
    separatorToken,
    context,
  };
}

/**
 * Defines a Block active node
 * @param context Context Variables required in the Block
 * @returns Object representing the Block
 */
export function block(context: Context = {}): TemplateBlock {
  return {
    kind: "block",
    context,
    blockType: Target.TypeScript,
  };
}

/**
 * Defines a Context Variable active node
 * @param name Name of the Context Variable
 * @returns Object representing the Context Variable
 */
export function contextVariable(name: string): TemplateContextVariable {
  return {
    kind: "contextVariable",
    name,
  };
}
