import Pattern from "./pattern/pattern";
import PatternNode from "./pattern/nodes/patternNode";
import TreePath from "./cursor/treePath";
import TransformableTemplate from "./template/transformableTemplate";
import WasmPathProvider from "./tree-sitter/wasmPathProvider";

export type { SyntaxNode } from "web-tree-sitter";
export { Parser } from "./parse/internal";
export { arg, agg, chain, block, contextVariable, reference } from "./template/definitionFunctions";
export { default as TemplateArgument } from "./template/parameters/templateArgument";
export { PatternMatching } from "./match/patternMatching";
export { createPatternMap } from "./common";
export type {
  PatternMap,
  AstNodeMap,
  Match,
  CodeRange,
  ContextInformationRange,
  ContextVariableRange,
  PatternsMap,
} from "./match/types";
export type { Pattern, PatternNode, WasmPathProvider, TransformableTemplate as Template };
export { TreePath };
