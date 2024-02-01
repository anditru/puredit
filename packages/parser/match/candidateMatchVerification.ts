import AstCursor, { Keyword } from "../ast/cursor";
import type { ArgMap, CandidateMatch, CodeBlock, Match } from "./types";
import type { Context } from "..";
import Pattern from "../pattern/pattern";
import ArgumentNode from "../pattern/argumentNode";
import BlockNode from "../pattern/blockNode";
import ContextVariableNode from "../pattern/contextVariableNode";
import PatternCursor from "../pattern/cursor";
import { logProvider } from "../../../logconfig";
import RegularNode from "../pattern/regularNode";

const logger = logProvider.getLogger("parser.match.CandidateMatchVerification");

/**
 * @class CandidateMatch
 * A CandidateMatch represents the combination of a pattern and a certain
 * prosition in the AST in which the pattern matches the AST. The position
 * in the AST is here represented by an AstCursor that points to the node
 * of the AST that serves as starting point from which the nodes of the
 * pattern are matched against those of the AST.
 */
export default class CandidateMatchVerification {
  private pattern: Pattern;
  private patternCursor: PatternCursor;
  private astCursor: AstCursor;
  private context: Context;

  private _args: ArgMap = {};
  private _blocks: CodeBlock[] = [];

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
      blocks: this._blocks,
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
    } else if (this.patternCursor.currentNode instanceof BlockNode) {
      this.visitBlockNode(lastSiblingKeyword);
    } else if (
      this.patternCursor.currentNode instanceof ContextVariableNode &&
      this.requiredContextExists(this.patternCursor.currentNode)
    ) {
      this.visitContextVariableNode();
    } else {
      this.visitRegularNode();
    }
  }

  private visitArgumentNode() {
    const argumentNode = this.patternCursor.currentNode as ArgumentNode;
    this._args[argumentNode.templateArgument.name] = this.astCursor.currentNode;
    if (!this.patternCursor.currentNode.matches(this.astCursor.currentNode)) {
      logger.debug("AST does not match ArgumentNode");
      throw new DoesNotMatch();
    }
  }

  private visitBlockNode(lastSiblingKeyword?: Keyword) {
    const blockNode = this.patternCursor.currentNode as BlockNode;
    const codeBlocks = this.extractCodeBlockFor(blockNode, lastSiblingKeyword);
    this._blocks.push(codeBlocks);
    if (!this.patternCursor.currentNode.matches(this.astCursor.currentNode)) {
      logger.debug("AST does not match BlockNode");
      throw new DoesNotMatch();
    }
  }

  private visitContextVariableNode() {
    const contextVariableNode = this.patternCursor.currentNode as ContextVariableNode;
    if (!contextVariableNode.matches(this.astCursor.currentNode, this.context)) {
      logger.debug("AST does not match ContextVariable");
      throw new DoesNotMatch();
    }
  }

  private visitRegularNode() {
    const regularNode = this.patternCursor.currentNode as RegularNode;
    this.checkNodeTypesMatch();

    if (regularNode.hasText()) {
      this.checkNodeTextsMatch();
      return;
    }

    if (!this.patternAndAstNodeHaveChildren()) {
      logger.debug("AST node or pattern node has neither text nor children");
      throw new DoesNotMatch();
    }

    this.patternCursor.goToFirstChild();
    this.astCursor.goToFirstChild();
    let [nextSiblingExists, lastKeyword] = this.astCursor.skipKeywordsAndGetLast();
    if (!nextSiblingExists) {
      logger.debug("Pattern node has children but AST node does not");
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

  private patternAndAstNodeHaveChildren() {
    return this.patternCursor.currentNode.hasChildren() && this.astCursor.currentNode.hasChildren();
  }

  private checkNodeTypesMatch() {
    const astNodeType = this.astCursor.currentNode.cleanNodeType;
    const patternNodeType = this.patternCursor.currentNode.type;
    if (astNodeType !== patternNodeType) {
      logger.debug(`Node types do not match. Pattern: ${patternNodeType}, "AST: ${astNodeType}`);
      throw new DoesNotMatch();
    }
  }

  private checkNodeTextsMatch() {
    const astNodeText = this.patternCursor.currentNode.text;
    const patternNodeText = this.patternCursor.currentNode.text;
    if (patternNodeText !== astNodeText) {
      logger.debug(`Node textes do not match. Pattern: ${patternNodeText}, "AST: ${astNodeText}`);
      throw new DoesNotMatch();
    }
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

  private extractCodeBlockFor(blockNode: BlockNode, lastSiblingKeyword?: Keyword): CodeBlock {
    let from = this.astCursor.startIndex;
    if (blockNode.templateBlock.blockType === "py" && lastSiblingKeyword?.type === ":") {
      from = lastSiblingKeyword.pos;
    }
    const rangeModifierStart = 1;
    const rangeModifierEnd = blockNode.templateBlock.blockType === "ts" ? 1 : 0;
    return {
      node: this.astCursor.currentNode,
      context: blockNode.templateBlock.context,
      from: from + rangeModifierStart,
      to: this.astCursor.endIndex - rangeModifierEnd,
      blockType: blockNode.templateBlock.blockType,
    };
  }

  private requiredContextExists(contextVariableNode: ContextVariableNode): boolean {
    return Object.prototype.hasOwnProperty.call(
      this.context,
      contextVariableNode.templateContextVariable.name
    );
  }
}

export class DoesNotMatch extends Error {
  constructor(message?: string) {
    super(message);
  }
}
