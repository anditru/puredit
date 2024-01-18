/**
 * @module match
 * Implements the pattern matching algorithm and exposes it
 * via the class PatternMatching
 */

import type { TreeCursor } from "web-tree-sitter";
import { isErrorToken, skipKeywords } from "./shared";
import type { Keyword } from "./shared";
import type {
  ArgMap,
  CodeBlock,
  ContextRange,
  PatternMatchingResult,
  Match,
  PatternMap,
  PatternNode,
} from "./types";
import type { Context } from ".";

export class PatternMatching {
  private matches: Match[] = [];
  private contextRanges: ContextRange[] = [];

  constructor(
    private patternMap: PatternMap,
    private cursor: TreeCursor,
    private context: Context = {},
    private to = Infinity
  ) {}

  execute(): PatternMatchingResult {
    do {
      if (this.candidatePatternsExistForCurrentNode()) {
        const firstMatch = this.findFirstMatchingCandidateForCurrentNode();
        if (firstMatch) {
          this.findMatchesInBlocksOf(firstMatch);
          continue;
        }
      }
      this.findMatchesInFirstChild();
    } while (this.cursor.gotoNextSibling() && this.cursor.startIndex < this.to);

    return { matches: this.matches, contextRanges: this.contextRanges };
  }

  private candidatePatternsExistForCurrentNode(): boolean {
    return !!this.patternMap[this.cursor.nodeType];
  }

  private findFirstMatchingCandidateForCurrentNode():
    | CandidateMatch
    | undefined {
    const candidatePatterns = this.getCandidatePatternsForCurrentNode();

    for (const candidatePattern of candidatePatterns) {
      const candidateMatch = new CandidateMatch(
        candidatePattern,
        this.cursor.currentNode().walk(),
        this.context
      );
      candidateMatch.verify();

      if (candidateMatch.matched) {
        this.matches.push({
          pattern: candidatePattern,
          node: this.cursor.currentNode(),
          args: candidateMatch.args,
          blocks: candidateMatch.blocks,
        });
        return candidateMatch;
      }
    }
  }

  private getCandidatePatternsForCurrentNode(): PatternNode[] {
    return this.patternMap[this.cursor.nodeType];
  }

  private findMatchesInBlocksOf(candidateMatch: CandidateMatch): void {
    for (const block of candidateMatch.blocks) {
      this.contextRanges.push({
        from: block.node.startIndex,
        to: block.node.endIndex,
        context: block.context,
      });

      const blockPatternMatching = new PatternMatching(
        this.patternMap,
        block.node.walk(),
        Object.assign({}, this.context, block.context)
      );
      const result = blockPatternMatching.execute();

      this.matches = this.matches.concat(result.matches);
      this.contextRanges = this.contextRanges.concat(result.contextRanges);
    }
  }

  private findMatchesInFirstChild(): void {
    if (this.cursor.gotoFirstChild()) {
      const childPatternMatching = new PatternMatching(
        this.patternMap,
        this.cursor,
        this.context,
        this.to
      );
      const result = childPatternMatching.execute();
      this.matches = this.matches.concat(result.matches);
      this.contextRanges = this.contextRanges.concat(result.contextRanges);

      this.cursor.gotoParent();
    }
  }
}

class CandidateMatch {
  private _matched: boolean | null = null;
  private _args: ArgMap = {};
  private _blocks: CodeBlock[] = [];

  constructor(
    private pattern: PatternNode,
    private cursor: TreeCursor,
    private context: Context,
    private lastSiblingKeyword?: Keyword
  ) {}

  public verify(): void {
    if (isErrorToken(this.cursor.nodeType)) {
      this._matched = false;
      return;
    }

    // The Python tree-sitter parser wrongly puts leading comments between
    // a with-clause and its body.
    // To still be able to match patterns that expect a body right after
    // the with-clause, we simply skip the comments.
    // The same applies to function definitions, where a comment on the
    // first line of the function body is put between the parameters
    // and the body.
    // This fix applies to both cases.
    // Also see https://github.com/tree-sitter/tree-sitter-python/issues/112.
    this.skipLeadingCommentsInBodies();

    if (!this.fieldNamesMatch()) {
      this._matched = false;
      return;
    }

    if (this.pattern.arg) {
      this.verifyArgumentNodeMatches();
      return;
    }

    if (this.pattern.block) {
      this.verifyBlockNodeMatches();
      return;
    }

    if (this.pattern.contextVariable && this.requiredContextExists()) {
      this.verifyContextVariableNodeMatches();
      return;
    }

    if (nodeType(this.cursor) !== this.pattern.type) {
      this._matched = false;
      return;
    }

    if (this.pattern.text) {
      this._matched = this.pattern.text === this.cursor.nodeText;
      return;
    }

    // A node must either contain text or children
    if (!this.pattern.children || !this.cursor.gotoFirstChild()) {
      this._matched = false;
      return;
    }

    if (!this.childrenMatch()) {
      this._matched = false;
      return;
    }

    this.cursor.gotoParent();
    this._matched = true;
  }

  private skipLeadingCommentsInBodies(): void {
    while (
      this.pattern.fieldName === "body" &&
      nodeType(this.cursor) === "comment"
    ) {
      this.cursor.gotoNextSibling();
    }
  }

  private fieldNamesMatch(): boolean {
    const fieldName = this.cursor.currentFieldName() || undefined;
    return fieldName === this.pattern.fieldName;
  }

  private verifyArgumentNodeMatches(): void {
    this._args[this.pattern.arg!.name] = this.cursor.currentNode();
    this._matched = this.pattern.arg!.types.includes(nodeType(this.cursor));
  }

  private verifyBlockNodeMatches(): void {
    let from = this.cursor.startIndex;
    if (
      this.pattern.block!.blockType === "py" &&
      this.lastSiblingKeyword?.type === ":"
    ) {
      from = this.lastSiblingKeyword.pos;
    }
    const rangeModifierStart = 1;
    const rangeModifierEnd = this.pattern.block!.blockType === "ts" ? 1 : 0;
    this._blocks.push({
      node: this.cursor.currentNode(),
      context: this.pattern.block!.context,
      from: from + rangeModifierStart,
      to: this.cursor.endIndex - rangeModifierEnd,
      blockType: this.pattern.block!.blockType,
    });
    switch (this.pattern.block!.blockType) {
      case "ts":
        this._matched = nodeType(this.cursor) === "statement_block";
        return;
      case "py":
        this._matched = nodeType(this.cursor) === "block";
        return;
    }
  }

  private requiredContextExists(): boolean {
    return Object.prototype.hasOwnProperty.call(
      this.context,
      this.pattern.contextVariable!.name
    );
  }

  private verifyContextVariableNodeMatches(): void {
    this._matched =
      nodeType(this.cursor) === "identifier" &&
      this.cursor.nodeText === this.context[this.pattern.contextVariable!.name];
  }

  private childrenMatch(): boolean {
    const requiredNumberOfChildren = this.pattern.children!.length;
    let [hasSibling, lastKeyword] = skipKeywords(this.cursor);
    if (!hasSibling && requiredNumberOfChildren > 0) {
      return false;
    }

    for (let i = 0; i < requiredNumberOfChildren; ) {
      const candidateChildMatch = new CandidateMatch(
        this.pattern.children![i],
        this.cursor,
        this.context,
        lastKeyword
      );
      candidateChildMatch.verify();

      if (!candidateChildMatch.matched) {
        return false;
      }

      this._blocks = this._blocks.concat(candidateChildMatch.blocks);
      this._args = { ...this._args, ...candidateChildMatch.args };

      i += 1;
      hasSibling = this.cursor.gotoNextSibling();
      if (hasSibling) {
        [hasSibling, lastKeyword] = skipKeywords(this.cursor);
      }
      if (
        (i < requiredNumberOfChildren && !hasSibling) ||
        (i >= requiredNumberOfChildren && hasSibling)
      ) {
        return false;
      }
    }
    return true;
  }

  public get matched() {
    this.checkMatchingExecuted();
    return this._matched;
  }

  public get blocks() {
    this.checkMatchingExecuted();
    return this._blocks;
  }

  public get args() {
    this.checkMatchingExecuted();
    return this._args;
  }

  private checkMatchingExecuted() {
    if (this._matched === null) {
      throw new Error("Matching has not been executed yet");
    }
  }
}

function nodeType(cursor: TreeCursor) {
  if (
    cursor.nodeType === "identifier" &&
    cursor.nodeText.startsWith("__empty_")
  ) {
    return cursor.nodeText.slice("__empty_".length);
  }
  return cursor.nodeType;
}
