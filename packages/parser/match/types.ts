import AstNode from "../ast/node";
import Pattern from "../pattern/pattern";
import AstCursor from "../ast/cursor";
import { Language } from "@puredit/language-config";
import { ContextInformation, ContextVariableMap } from "@puredit/projections";

export type PatternMap = Record<string, Pattern>;
export type PatternsMap = Record<string, Pattern[]>;

export interface ContextVariableRange {
  from: number;
  to: number;
  contextVariables: ContextVariableMap;
}

export interface ContextInformationRange {
  from: number;
  to: number;
  contextInformation: ContextInformation;
}

// Result of Phase 1 (Generation of candidate matches)
export interface CandidateMatch {
  pattern: Pattern;
  cursor: AstCursor;
  contextVariables: ContextVariableMap;
}

// Result of Phase 2 (Verification of candidate matches)
export interface VerificationResult {
  pattern: Pattern;
  node: AstNode;
  argsToAstNodeMap: AstNodeMap;
  blockRanges: CodeRange[];
  aggregationToRangeMap: CodeRangeMap;
  aggregationToStartRangeMap: CodeRangeMap;
  aggregationToPartRangesMap: CodeRangesMap;
  chainToStartRangeMap: CodeRangeMap;
  chainToLinkRangesMap: CodeRangesMap;
}
export type AstNodeMap = Record<string, AstNode>;
export type CodeRangesMap = Record<string, CodeRange[]>;
export type CodeRangeMap = Record<string, CodeRange>;

export interface CodeRange {
  from: number;
  to: number;
  language: Language;
  node: AstNode;
  contextVariables: ContextVariableMap;
}

// Result of Phase 3 (Post-processing)
export interface Match {
  pattern: Pattern;
  node: AstNode;
  from: number;
  to: number;
  argsToAstNodeMap: AstNodeMap;
  aggregationRanges: CodeRange[];
  chainRanges: CodeRange[];
  blockRanges: CodeRange[];
  contextInformation: ContextInformation;
  aggregationToRangeMap: CodeRangeMap;
  aggregationToStartMatchMap: MatchMap;
  aggregationToPartMatchesMap: MatchesMap;
}

export type MatchMap = Record<string, Match>;
export type MatchesMap = Record<string, Match[]>;

// Result of Phase 4 (Consolidation)
export interface PatternMatchingResult {
  matches: Match[];
  contextVariableRanges: ContextVariableRange[];
}
