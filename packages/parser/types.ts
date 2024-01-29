import type { Target } from "./treeSitterParser";
import AstNode from "./ast/node";
import Pattern from "./pattern/pattern";

export type PatternMap = Record<string, Pattern[]>;

export type ArgMap = Record<string, AstNode>;

export interface Match {
  pattern: Pattern;
  node: AstNode;
  args: ArgMap;
  blocks: CodeBlock[];
}

export type Context = Record<string, string>;

export interface ContextRange {
  from: number;
  to: number;
  context: Context;
}

export interface CodeBlock {
  node: AstNode;
  context: Context;
  from: number;
  to: number;
  blockType: Target;
}

export interface PatternMatchingResult {
  matches: Match[];
  contextRanges: ContextRange[];
}
