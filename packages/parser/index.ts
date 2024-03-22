import Pattern from "./pattern/pattern";
import PatternNode from "./pattern/nodes/patternNode";
import TreePath from "./cursor/treePath";
import Template from "./template/template";
import WasmPathProvider from "./tree-sitter/wasmPathProvider";

export type { SyntaxNode } from "web-tree-sitter";
export { Parser } from "./parse/internal";
export { arg, agg, chain, block, contextVariable } from "./template/definitionFunctions";
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
export type { Pattern, PatternNode, WasmPathProvider };
export { Template, TreePath };
