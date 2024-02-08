import AstCursor, { Keyword } from "../ast/cursor";
import type { AggregationRangeMap, ArgMap, CandidateMatch, CodeRange, Match } from "./types";
import { Target, type Context } from "..";
import Pattern from "../pattern/pattern";
import ArgumentNode from "../pattern/nodes/argumentNode";
import BlockNode from "../pattern/nodes/blockNode";
import PatternCursor from "../pattern/cursor";
import RegularNode from "../pattern/nodes/regularNode";
import AggregationNode from "../pattern/nodes/aggregationNode";

import { logProvider } from "../../../logconfig";
const logger = logProvider.getLogger("parser.match.MatchVerification");

export default class MatchVerification {
  private pattern: Pattern;
  private patternCursor: PatternCursor;
  private astCursor: AstCursor;
  private context: Context;

  private _args: ArgMap = {};
  private _blockRanges: CodeRange[] = [];
  private _aggregationRangeMap: AggregationRangeMap = {};

  constructor(private candidateMatch: CandidateMatch) {
    this.pattern = this.candidateMatch.pattern;
    this.patternCursor = new PatternCursor(this.pattern);
    this.astCursor = this.candidateMatch.cursor;
    this.context = this.candidateMatch.context;
  }

  /**
   * Checks if the pattern of this CandidateMatch actually matches the
   * AST at the position of the cursor by recursively creating new
   * CandateMatches for the child nodes in a depth-first manner.
   */
  public execute(lastSiblingKeyword?: Keyword): Match {
    logger.debug("Starting new verification of CandidateMatch");
    this.recurse(lastSiblingKeyword);
    return {
      pattern: this.pattern,
      node: this.astCursor.currentNode,
      args: this._args,
      blockRanges: this._blockRanges,
      aggregationRangeMap: this._aggregationRangeMap,
      aggregationMatchMap: {},
    };
  }

  private recurse(lastSiblingKeyword?: Keyword) {
    logger.debug(
      `Pattern node type: ${this.patternCursor.currentNode.type}, ` +
        `AST node type: ${this.astCursor.currentNode.cleanNodeType}`
    );

    this.checkNoErrorToken();
    this.skipLeadingCommentsInBodies();
    this.checkFieldNamesMatch();

    if (this.patternCursor.currentNode instanceof ArgumentNode) {
      this.visitArgumentNode();
    } else if (this.patternCursor.currentNode instanceof AggregationNode) {
      this.visitAggregationNode();
    } else if (this.patternCursor.currentNode instanceof BlockNode) {
      this.visitBlockNode(lastSiblingKeyword);
    } else if (this.patternCursor.currentNode instanceof RegularNode) {
      this.visitRegularNode();
    } else {
      throw new Error("Invalid node type");
    }
  }

  private visitArgumentNode() {
    const argumentNode = this.patternCursor.currentNode as ArgumentNode;
    if (!this.patternCursor.currentNode.matches(this.astCursor.currentNode)) {
      logger.debug("AST does not match ArgumentNode");
      throw new DoesNotMatch();
    }
    this._args[argumentNode.templateArgument.name] = this.astCursor.currentNode;
  }

  private visitAggregationNode() {
    const aggregationNode = this.patternCursor.currentNode as AggregationNode;
    if (!this.patternCursor.currentNode.matches(this.astCursor.currentNode)) {
      logger.debug("AST node does not match AggregationNode");
      throw new DoesNotMatch();
    }
    const aggregationRanges = this.extractAggregationRangesFor(aggregationNode);
    this._aggregationRangeMap[aggregationNode.templateAggregation.name] = aggregationRanges;
  }

  private visitBlockNode(lastSiblingKeyword?: Keyword) {
    const blockNode = this.patternCursor.currentNode as BlockNode;
    if (!this.patternCursor.currentNode.matches(this.astCursor.currentNode)) {
      logger.debug("AST does not match BlockNode");
      throw new DoesNotMatch();
    }
    const blockRange = this.extractBlockRangeFor(blockNode, lastSiblingKeyword);
    this._blockRanges.push(blockRange);
  }

  private visitRegularNode() {
    const regularNode = this.patternCursor.currentNode as RegularNode;
    if (!regularNode.matches(this.astCursor.currentNode, this.context)) {
      logger.debug("AST does not match RegularNode.");
      throw new DoesNotMatch();
    }

    if (!regularNode.hasChildren()) {
      return;
    }

    if (!this.astCursor.currentNode.hasChildren()) {
      logger.debug("Pattern node has children but AST node does not");
      throw new DoesNotMatch();
    }

    this.patternCursor.goToFirstChild();
    this.astCursor.goToFirstChild();
    let [nextSiblingExists, lastKeyword] = this.astCursor.skipKeywordsAndGetLast();
    if (!nextSiblingExists) {
      logger.debug("Patter node has children but AST node only has keywords as children");
      throw new DoesNotMatch();
    }

    const requiredNumberOfChildren = regularNode.children!.length;
    for (let i = 0; i < requiredNumberOfChildren; ) {
      this.recurse(lastKeyword);

      i += 1;
      this.patternCursor.goToNextSibling();
      nextSiblingExists = this.astCursor.goToNextSibling();

      if (nextSiblingExists) {
        [nextSiblingExists, lastKeyword] = this.astCursor.skipKeywordsAndGetLast();
      }

      // Check AST node does not have too few or too many children
      if (
        (i < requiredNumberOfChildren && !nextSiblingExists) ||
        (i >= requiredNumberOfChildren && nextSiblingExists)
      ) {
        logger.debug("AST node does not have sufficient amount of children");
        throw new DoesNotMatch();
      }
    }

    this.astCursor.goToParent();
    this.patternCursor.goToParent();
  }

  private checkNoErrorToken() {
    if (this.astCursor.currentNode.isErrorToken()) {
      logger.debug("Error token encountered");
      throw new DoesNotMatch();
    }
  }

  private checkFieldNamesMatch() {
    if (!this.fieldNamesMatch()) {
      logger.debug(
        `FieldNames do not match. Pattern: ${this.patternCursor.currentNode.fieldName}, ` +
          `AST: ${this.astCursor.currentFieldName}`
      );
      throw new DoesNotMatch();
    }
  }

  private fieldNamesMatch(): boolean {
    const fieldName = this.astCursor.currentFieldName || undefined;
    return fieldName === this.patternCursor.currentNode.fieldName;
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
      this.patternCursor.currentNode.fieldName === "body" &&
      this.astCursor.currentNode.cleanNodeType === "comment"
    ) {
      this.astCursor.goToNextSibling();
    }
  }

  private extractAggregationRangesFor(aggregationNode: AggregationNode): CodeRange[] {
    const currentAstNode = this.astCursor.currentNode;

    const aggregationPartRoots = currentAstNode.children.filter((astNode) => {
      return !(
        astNode.text === aggregationNode.startToken ||
        astNode.text === aggregationNode.delimiterToken ||
        astNode.text === aggregationNode.endToken
      );
    });

    return aggregationPartRoots.map((aggregationPartRoot) => ({
      node: aggregationPartRoot,
      context: aggregationNode.templateAggregation.context,
      from: aggregationPartRoot.startIndex,
      to: aggregationPartRoot.endIndex,
      language: aggregationNode.language,
    }));
  }

  private extractBlockRangeFor(blockNode: BlockNode, lastSiblingKeyword?: Keyword): CodeRange {
    let from = this.astCursor.startIndex;
    if (blockNode.language === Target.Python && lastSiblingKeyword?.type === ":") {
      from = lastSiblingKeyword.pos;
    }
    const rangeModifierStart = 1;
    const rangeModifierEnd = blockNode.language === Target.TypeScript ? 1 : 0;
    return {
      node: this.astCursor.currentNode,
      context: blockNode.templateBlock.context,
      from: from + rangeModifierStart,
      to: this.astCursor.endIndex - rangeModifierEnd,
      language: blockNode.language,
    };
  }
}

export class DoesNotMatch extends Error {
  constructor(message?: string) {
    super(message);
  }
}
