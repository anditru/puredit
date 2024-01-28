import type { SyntaxNode } from "web-tree-sitter";
import type { Target } from "./treeSitterParser";
import TemplateArgument from "./define/templateArgument";
import TemplateAggregation from "./define/templateAggregation";
import TemplateBlock from "./define/templateBlock";
import TemplateContextVariable from "./define/templateContextVariable";

export type { SyntaxNode };

export interface PatternNode {
  type: string;
  fieldName?: string;
  children?: PatternNode[];
  text?: string;
  arg?: TemplateArgument;
  agg?: TemplateAggregation;
  block?: TemplateBlock;
  contextVariable?: TemplateContextVariable;
  draft?: PatternDraft;
}

type PatternDraft = (context: Context) => string;

export type PatternMap = Record<string, PatternNode[]>;

export type ArgMap = Record<string, SyntaxNode>;

export interface Match {
  pattern: PatternNode;
  node: SyntaxNode;
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
  node: SyntaxNode;
  context: Context;
  from: number;
  to: number;
  blockType: Target;
}

export interface PatternMatchingResult {
  matches: Match[];
  contextRanges: ContextRange[];
}
