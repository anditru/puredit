import AstCursor, { Keyword } from "../ast/cursor";
import { isErrorToken } from "../common";
import type { ArgMap, CodeBlock, PatternNode } from "../types";
import type { Context } from "..";

/**
 * @class CandidateMatch
 * A CandidateMatch represents the combination of a pattern and a certain
 * prosition in the AST in which the pattern matches the AST. The position
 * in the AST is here represented by an AstCursor that points to the node
 * of the AST that serves as starting point from which the nodes of the
 * pattern are matched against those of the AST.
 */
export class CandidateMatch {
  private _matched: boolean | null = null;
  private _args: ArgMap = {};
  private _blocks: CodeBlock[] = [];

  constructor(
    private pattern: PatternNode,
    private cursor: AstCursor,
    private context: Context,
    private lastSiblingKeyword?: Keyword
  ) {}

  /**
   * Checks if the pattern of this CandidateMatch actually matches the
   * AST at the position of the cursor by recursively creating new
   * CandateMatches for the child nodes in a depth-first manner.
   */
  public verify(): void {
    if (isErrorToken(this.cursor.currentNode.type)) {
      this._matched = false;
      return;
    }

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

    if (this.cursor.currentNode.cleanNodeType !== this.pattern.type) {
      this._matched = false;
      return;
    }

    if (this.pattern.text) {
      this._matched = this.pattern.text === this.cursor.currentNode.text;
      return;
    }

    // A node must either contain text or children
    if (!this.pattern.children || !this.cursor.goToFirstChild()) {
      this._matched = false;
      return;
    }

    if (!this.childrenMatch()) {
      this._matched = false;
      return;
    }

    this.cursor.goToParent();
    this._matched = true;
  }

  /**
   * The Python tree-sitter parser wrongly puts leading comments between
   * a with-clause and its body.
   * To still be able to match patterns that expect a body right after
   * the with-clause, we simply skip the comments.
   * The same applies to function definitions, where a comment on the
   * first line of the function body is put between the parameters
   * and the body.
   * This fix applies to both cases.
   * Also see https://github.com/tree-sitter/tree-sitter-python/issues/112.
   */
  private skipLeadingCommentsInBodies(): void {
    while (
      this.pattern.fieldName === "body" &&
      this.cursor.currentNode.cleanNodeType === "comment"
    ) {
      this.cursor.goToNextSibling();
    }
  }

  private fieldNamesMatch(): boolean {
    const fieldName = this.cursor.currentFieldName || undefined;
    return fieldName === this.pattern.fieldName;
  }

  private verifyArgumentNodeMatches(): void {
    this._args[this.pattern.arg!.name] = this.cursor.currentNode;
    this._matched = this.pattern.arg!.types.includes(
      this.cursor.currentNode.cleanNodeType
    );
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
      node: this.cursor.currentNode,
      context: this.pattern.block!.context,
      from: from + rangeModifierStart,
      to: this.cursor.endIndex - rangeModifierEnd,
      blockType: this.pattern.block!.blockType,
    });
    switch (this.pattern.block!.blockType) {
      case "ts":
        this._matched =
          this.cursor.currentNode.cleanNodeType === "statement_block";
        return;
      case "py":
        this._matched = this.cursor.currentNode.cleanNodeType === "block";
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
      this.cursor.currentNode.cleanNodeType === "identifier" &&
      this.cursor.currentNode.text ===
        this.context[this.pattern.contextVariable!.name];
  }

  private childrenMatch(): boolean {
    const requiredNumberOfChildren = this.pattern.children!.length;
    let [hasSibling, lastKeyword] = this.cursor.skipKeywords();
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
      hasSibling = this.cursor.goToNextSibling();
      if (hasSibling) {
        [hasSibling, lastKeyword] = this.cursor.skipKeywords();
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
