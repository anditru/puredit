import Parser from "./parse/parser";

export { Parser };
export { arg, agg, block, contextVariable } from "./define";
export { PatternMatching } from "./match/patternMatching";
export { Target } from "./treeSitterParser";
export { createPatternMap } from "./parse/patternNodeBuilder";
export type {
  SyntaxNode,
  PatternNode,
  PatternMap,
  ArgMap,
  TemplateArg,
  TemplateAgg,
  TemplateBlock,
  TemplateParam,
  Match,
  Context,
} from "./types";

export { AggregationCardinality } from "./types";
