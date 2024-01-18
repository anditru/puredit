import Parser from "./parser";

export { Parser };
export { arg, agg, block, contextVariable } from "./define";
export { findPatterns } from "./match";
export { Target } from "./treeSitterParser";
export { createPatternMap } from "./pattern";
export type {
  SyntaxNode,
  PatternNode,
  PatternMap,
  ArgMap,
  TemplateArg,
  TemplateAgg,
  AggregationCardinality,
  TemplateBlock,
  TemplateParam,
  Match,
  Context,
} from "./types";
