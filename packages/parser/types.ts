import type { SyntaxNode } from "web-tree-sitter";
import type { Target } from "./treeSitterParser";

export type { SyntaxNode };

export interface AggPart {
  template: TemplateStringsArray;
  params: (string | TemplateParam)[];
}

export interface PatternNode {
  type: string;
  fieldName?: string;
  children?: PatternNode[];
  text?: string;
  arg?: TemplateArg;
  agg?: TemplateAgg;
  block?: TemplateBlock;
  contextVariable?: TemplateContextVariable;
  draft?: PatternDraft;
}

type PatternDraft = (context: Context) => string;

export type PatternMap = Record<string, PatternNode[]>;

export type ArgMap = Record<string, SyntaxNode>;

export interface TemplateArg {
  kind: "arg";
  name: string;
  types: string[];
}

export interface TemplateAgg {
  kind: "agg";
  name: string;
  allowedPatterns: AggPart[];
  cardinality: AggregationCardinality;
  separatorToken?: string;
  context: Context;
}

export enum AggregationCardinality {
  ZeroToOne = "0..1",
  ZeroToMany = "0..n",
  OneToMany = "1..n",
}

export interface TemplateBlock {
  kind: "block";
  context: Context;
  blockType: Target;
}

export interface TemplateContextVariable {
  kind: "contextVariable";
  name: string;
}

export type TemplateParam =
  | TemplateArg
  | TemplateAgg
  | TemplateBlock
  | TemplateContextVariable;

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
