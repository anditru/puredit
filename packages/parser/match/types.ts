import AstNode from "../ast/node";
import Pattern from "../pattern/pattern";
import AstCursor from "../ast/cursor";
import { Language } from "../config/types";

export type PatternMap = Record<string, Pattern[]>;

export type Context = Record<string, string>;
export interface ContextRange {
  from: number;
  to: number;
  context: Context;
}

// Result of Phase 1 (Generation of candidate matches)
export interface CandidateMatch {
  pattern: Pattern;
  cursor: AstCursor;
  context: Context;
}

// Result of Phase 2 (Verification of candidate matches)
export interface VerificationResult {
  pattern: Pattern;
  node: AstNode;
  argsToAstNodeMap: AstNodeMap;
  blockRanges: CodeRange[];
  aggregationToRangesMap: CodeRangesMap;
  chainToStartRangeMap: CodeRangeMap;
  chainToLinkRangesMap: CodeRangesMap;
}
export type AstNodeMap = Record<string, AstNode>;
export type CodeRangesMap = Record<string, CodeRange[]>;
export type CodeRangeMap = Record<string, CodeRange>;

export interface CodeRange {
  node: AstNode;
  context: Context;
  from: number;
  to: number;
  language: Language;
}

// Result of Phase 3 (Post-processing)
export interface Match {
  pattern: Pattern;
  node: AstNode;
  argsToAstNodeMap: AstNodeMap;
  aggregationToSubMatchesMap: SubMatchesMap;
  blockRanges: CodeRange[];
}
export type SubMatchesMap = Record<string, SubMatch[]>;

export interface SubMatch {
  pattern: Pattern;
  node: AstNode;
  argsToAstNodeMap: AstNodeMap;
}

// Result of Phase 4 (Consolidation)
export interface PatternMatchingResult {
  matches: Match[];
  contextRanges: ContextRange[];
}
