import AstCursor, { Keyword } from "../ast/cursor";
import { isErrorToken } from "../common";
import type { ArgMap, CodeBlock } from "../types";
import type { Context } from "..";
import PatternNode from "../pattern/patternNode";
import ArgumentNode from "../pattern/argumentNode";
import BlockNode from "../pattern/blockNode";
import ContextVariableNode from "../pattern/contextVariableNode";

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
    private patternNode: PatternNode,
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

    if (this.patternNode instanceof ArgumentNode) {
      this._args[this.patternNode.templateArgument.name] =
        this.cursor.currentNode;
      this._matched = this.patternNode.matches(this.cursor.currentNode);
      return;
    }

    if (this.patternNode instanceof BlockNode) {
      this._blocks.push(this.extractCodeBlockFor(this.patternNode));
      this._matched = this.patternNode.matches(this.cursor.currentNode);
      return;
    }

    if (
      this.patternNode instanceof ContextVariableNode &&
      this.requiredContextExists(this.patternNode)
    ) {
      this._matched =
        this.patternNode.matches(this.cursor.currentNode) &&
        this.cursor.currentNode.text ===
          this.context[this.patternNode.templateContextVariable.name];
      return;
    }

    if (this.cursor.currentNode.cleanNodeType !== this.patternNode.type) {
      this._matched = false;
      return;
    }

    if (this.patternNode.text) {
      this._matched = this.patternNode.text === this.cursor.currentNode.text;
      return;
    }

    // A node must either contain text or children
    if (!this.patternNode.children || !this.cursor.goToFirstChild()) {
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
      this.patternNode.fieldName === "body" &&
      this.cursor.currentNode.cleanNodeType === "comment"
    ) {
      this.cursor.goToNextSibling();
    }
  }

  private fieldNamesMatch(): boolean {
    const fieldName = this.cursor.currentFieldName || undefined;
    return fieldName === this.patternNode.fieldName;
  }

  private extractCodeBlockFor(blockNode: BlockNode): CodeBlock {
    let from = this.cursor.startIndex;
    if (
      blockNode.templateBlock.blockType === "py" &&
      this.lastSiblingKeyword?.type === ":"
    ) {
      from = this.lastSiblingKeyword.pos;
    }
    const rangeModifierStart = 1;
    const rangeModifierEnd = blockNode.templateBlock.blockType === "ts" ? 1 : 0;
    return {
      node: this.cursor.currentNode,
      context: blockNode.templateBlock.context,
      from: from + rangeModifierStart,
      to: this.cursor.endIndex - rangeModifierEnd,
      blockType: blockNode.templateBlock.blockType,
    };
  }

  private requiredContextExists(
    contextVariableNode: ContextVariableNode
  ): boolean {
    return Object.prototype.hasOwnProperty.call(
      this.context,
      contextVariableNode.templateContextVariable.name
    );
  }

  private childrenMatch(): boolean {
    const requiredNumberOfChildren = this.patternNode.children!.length;
    let [hasSibling, lastKeyword] = this.cursor.skipKeywords();
    if (!hasSibling && requiredNumberOfChildren > 0) {
      return false;
    }

    for (let i = 0; i < requiredNumberOfChildren; ) {
      const candidateChildMatch = new CandidateMatch(
        this.patternNode.children![i],
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
