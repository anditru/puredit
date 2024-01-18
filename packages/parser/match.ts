/**
 * @module match
 * Implements the pattern matching algorithm and exposes it
 * via the function findPatterns
 */

import type { TreeCursor } from "web-tree-sitter";
import { isErrorToken, skipKeywords } from "./shared";
import type { Keyword } from "./shared";
import type {
  ArgMap,
  CodeBlock,
  ContextRange,
  FindPatternsResult,
  Match,
  PatternMap,
  PatternNode,
} from "./types";
import type { Context } from ".";

export class PatternSearch {
  constructor(
    public patternMap: PatternMap,
    public cursor: TreeCursor,
    public context: Context = {}
  ) {}

  start(to = Infinity): FindPatternsResult {
    let matches: Match[] = [];
    let contextRanges: ContextRange[] = [];
    do {
      if (this.candidatePatternsExist()) {
        const candidatePatterns = this.getCandidatePatterns();
        let foundPattern = false;

        for (const candidatePattern of candidatePatterns) {
          const args: ArgMap = {};
          const blocks: CodeBlock[] = [];

          const candidateMatch = new CandidateMatch(
            candidatePattern,
            this.cursor.currentNode().walk(),
            this.context,
            args,
            blocks
          );

          if (candidateMatch.matches()) {
            matches.push({
              pattern: candidatePattern,
              node: this.cursor.currentNode(),
              args,
              blocks,
            });

            for (const block of blocks) {
              contextRanges.push({
                from: block.node.startIndex,
                to: block.node.endIndex,
                context: block.context,
              });

              const blockPatternSearch = new PatternSearch(
                this.patternMap,
                block.node.walk(),
                Object.assign({}, this.context, block.context)
              );
              const result = blockPatternSearch.start(to);

              matches = matches.concat(result.matches);
              contextRanges = contextRanges.concat(result.contextRanges);
            }

            foundPattern = true;
            break;
          }
        }

        if (foundPattern) {
          continue;
        }
      }

      if (this.cursor.gotoFirstChild()) {
        const childPatternSearch = new PatternSearch(
          this.patternMap,
          this.cursor,
          this.context
        );
        const result = childPatternSearch.start(to);
        matches = matches.concat(result.matches);
        contextRanges = contextRanges.concat(result.contextRanges);

        this.cursor.gotoParent();
      }
    } while (this.cursor.gotoNextSibling() && this.cursor.startIndex < to);
    return { matches, contextRanges };
  }

  candidatePatternsExist(): boolean {
    return !!this.patternMap[this.cursor.nodeType];
  }

  getCandidatePatterns(): PatternNode[] {
    return this.patternMap[this.cursor.nodeType];
  }
}

class CandidateMatch {
  constructor(
    public pattern: PatternNode,
    public cursor: TreeCursor,
    public context: Context,
    public args: ArgMap,
    public blocks: CodeBlock[]
  ) {}

  public matches(lastSiblingKeyword?: Keyword): boolean {
    if (isErrorToken(this.cursor.nodeType)) {
      return false;
    }
    while (
      this.pattern.fieldName === "body" &&
      nodeType(this.cursor) === "comment"
    ) {
      // The Python tree-sitter parser wrongly puts leading comments between
      // a with-clause and its body.
      // To still be able to match patterns that expect a body right after
      // the with-clause, we simply skip the comments.
      // The same applies to function definitions, where a comment on the
      // first line of the function body is put between the parameters
      // and the body.
      // This fix applies to both cases.
      // Also see https://github.com/tree-sitter/tree-sitter-python/issues/112.
      this.cursor.gotoNextSibling();
    }
    const fieldName = this.cursor.currentFieldName() || undefined;
    if (fieldName !== this.pattern.fieldName) {
      return false;
    }
    if (this.pattern.arg) {
      this.args[this.pattern.arg.name] = this.cursor.currentNode();
      return this.pattern.arg.types.includes(nodeType(this.cursor));
    }
    if (this.pattern.block) {
      let from = this.cursor.startIndex;
      if (
        this.pattern.block.blockType === "py" &&
        lastSiblingKeyword?.type === ":"
      ) {
        from = lastSiblingKeyword.pos;
      }
      const rangeModifierStart = 1;
      const rangeModifierEnd = this.pattern.block.blockType === "ts" ? 1 : 0;
      this.blocks.push({
        node: this.cursor.currentNode(),
        context: this.pattern.block.context,
        from: from + rangeModifierStart,
        to: this.cursor.endIndex - rangeModifierEnd,
        blockType: this.pattern.block.blockType,
      });
      switch (this.pattern.block.blockType) {
        case "ts":
          return nodeType(this.cursor) === "statement_block";
        case "py":
          return nodeType(this.cursor) === "block";
      }
    }
    if (
      this.pattern.contextVariable &&
      Object.prototype.hasOwnProperty.call(
        this.context,
        this.pattern.contextVariable.name
      )
    ) {
      return (
        nodeType(this.cursor) === "identifier" &&
        this.cursor.nodeText === this.context[this.pattern.contextVariable.name]
      );
    }
    if (nodeType(this.cursor) !== this.pattern.type) {
      return false;
    }
    if (this.pattern.text) {
      return this.pattern.text === this.cursor.nodeText;
    }
    // A node must either contain text or children
    if (!this.pattern.children || !this.cursor.gotoFirstChild()) {
      return false;
    }
    const length = this.pattern.children.length;
    let [hasSibling, lastKeyword] = skipKeywords(this.cursor);
    if (!hasSibling && length > 0) {
      return false;
    }
    for (let i = 0; i < length; ) {
      const candidateChildMatch = new CandidateMatch(
        this.pattern.children[i],
        this.cursor,
        this.context,
        this.args,
        this.blocks
      );
      if (!candidateChildMatch.matches(lastKeyword)) {
        return false;
      }
      i += 1;
      hasSibling = this.cursor.gotoNextSibling();
      if (hasSibling) {
        [hasSibling, lastKeyword] = skipKeywords(this.cursor);
      }
      if ((i < length && !hasSibling) || (i >= length && hasSibling)) {
        return false;
      }
    }
    this.cursor.gotoParent();
    return true;
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
