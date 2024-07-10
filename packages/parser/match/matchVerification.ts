import AstCursor, { Keyword } from "../ast/cursor";
import type {
  AstNodeMap,
  CandidateMatch,
  CodeRange,
  CodeRangeMap,
  CodeRangesMap,
  ContextVariableRange,
  Match,
  MatchesMap,
  MatchMap,
  VerificationResult,
} from "./types";
import { PatternMatching } from "..";
import { ContextVariableMap } from "@puredit/projections";
import Pattern from "../pattern/pattern";
import ArgumentNode from "../pattern/nodes/argumentNode";
import BlockNode from "../pattern/nodes/blockNode";
import PatternCursor from "../pattern/cursor";
import RegularNode from "../pattern/nodes/regularNode";
import AggregationNode from "../pattern/nodes/aggregationNode";
import ChainNode from "../pattern/nodes/chainNode";
import ChainDecorator from "../pattern/decorators/chainDecorator";
import ChainContinuationNode from "../pattern/nodes/chainContinuationNode";
import {
  Language,
  loadChainableNodeTypeConfigFor,
  ChainableNodeTypeConfig,
  loadAggregatableNodeTypeConfigFor,
} from "@puredit/language-config";
import AggregationDecorator from "../pattern/decorators/aggregationDecorator";
import { loadLookAheadPathFor } from "@puredit/language-config/load";

import { logProvider } from "../../../logconfig";
const logger = logProvider.getLogger("parser.match.MatchVerification");

export default class MatchVerification {
  // Input
  private pattern: Pattern;
  private patternCursor: PatternCursor;
  private astCursor: AstCursor;
  private contextVariables: ContextVariableMap;

  // State
  private lastSiblingKeyword: Keyword | null = null;

  // Output
  private argsToAstNodeMap: AstNodeMap = {};
  private blockRanges: CodeRange[] = [];
  private chainRanges: CodeRange[] = [];
  private contextVariableRanges: ContextVariableRange[] = [];
  private aggregationToRangeMap: CodeRangeMap = {};
  private aggregationToPartRangesMap: CodeRangesMap = {};
  private aggregationToStartMatchMap: MatchMap = {};
  private aggregationToPartMatchesMap: MatchesMap = {};
  private chainToStartMatchMap: MatchMap = {};
  private chainToLinkMatchesMap: MatchesMap = {};
  private matchesBelow: Match[] = [];

  constructor(private candidateMatch: CandidateMatch) {
    this.pattern = this.candidateMatch.pattern;
    this.patternCursor = new PatternCursor(this.pattern);
    this.astCursor = this.candidateMatch.cursor;
    this.contextVariables = this.candidateMatch.contextVariables;
  }

  /**
   * Checks if the pattern of this CandidateMatch actually matches the
   * AST at the position of the cursor by recursively creating new
   * CandateMatches for the child nodes in a depth-first manner.
   */
  public execute(): VerificationResult {
    logger.debug(`Starting new verification of CandidateMatch with Pattern ${this.pattern.name}`);
    this.recurse();
    return {
      pattern: this.pattern,
      node: this.astCursor.currentNode,
      argsToAstNodeMap: this.argsToAstNodeMap,
      blockRanges: this.blockRanges,
      chainRanges: this.chainRanges,
      aggregationPartRanges: this.getAggregationPartRanges(),
      contextVariableRanges: this.contextVariableRanges,
      aggregationToRangeMap: this.aggregationToRangeMap,
      aggregationToPartRangesMap: this.aggregationToPartRangesMap,
      aggregationToStartMatchMap: this.aggregationToStartMatchMap,
      aggregationToPartMatchesMap: this.aggregationToPartMatchesMap,
      chainToStartMatchMap: this.chainToStartMatchMap,
      chainToLinkMatchesMap: this.chainToLinkMatchesMap,
      matchesBelow: this.matchesBelow,
    };
  }

  private recurse() {
    const currentAstNode = this.astCursor.currentNode;
    const currentPatternNode = this.patternCursor.currentNode;

    let ignoredNode = false;
    if (
      currentAstNode.type === "parenthesized_expression" &&
      currentAstNode.children[1]?.type === "call"
    ) {
      const fieldName = this.astCursor.currentFieldName;
      this.astCursor.goToFirstChild();
      this.astCursor.goToNextSibling();
      this.astCursor.currentFieldName = fieldName;
      ignoredNode = true;
    }

    this.checkNoErrorToken();
    this.skipLeadingCommentsInBodies();

    if (currentAstNode.isKeyword()) {
      this.visitKeywordNode();
    } else if (currentPatternNode instanceof ArgumentNode) {
      this.visitArgumentNode();
    } else if (currentPatternNode instanceof AggregationNode) {
      this.visitAggregationNode();
    } else if (currentPatternNode instanceof ChainNode) {
      this.visitChainNode();
    } else if (currentPatternNode instanceof ChainContinuationNode) {
      this.visitChainContinuationNode();
    } else if (currentPatternNode instanceof BlockNode) {
      this.visitBlockNode();
    } else if (currentPatternNode instanceof RegularNode) {
      this.visitRegularNode();
    } else {
      logger.debug(`Unsupported node type ${currentPatternNode.type} encountered`);
      throw new DoesNotMatch();
    }

    if (ignoredNode) {
      this.astCursor.goToParent();
    }
  }

  private getAggregationPartRanges(): CodeRange[] {
    return Object.values(this.aggregationToPartRangesMap).reduce(
      (previousAggregationRanges: CodeRange[], currentAggregationRange: CodeRange[]) => {
        return previousAggregationRanges.concat(currentAggregationRange);
      },
      []
    );
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

  private visitArgumentNode() {
    const argumentNode = this.patternCursor.currentNode as ArgumentNode;
    logger.debug(
      `Visiting ArgumentNode comparing to AST node of type ${this.astCursor.currentNode.type}`
    );

    if (!argumentNode.matches(this.astCursor)) {
      logger.debug("AST does not match ArgumentNode");
      throw new DoesNotMatch();
    }
    this.argsToAstNodeMap[argumentNode.name] = this.astCursor.currentNode;
  }

  private visitKeywordNode() {
    const regularNode = this.patternCursor.currentNode as RegularNode;
    logger.debug(
      `Visiting RegularNode comparing to AST node of type ${this.astCursor.currentNode.type}`
    );

    if (regularNode.text !== this.astCursor.currentNode.text) {
      logger.debug("Keyword AST node does not match RegularNode");
      throw new DoesNotMatch();
    }
  }

  private visitAggregationNode() {
    const aggregationNode = this.patternCursor.currentNode as AggregationNode;
    logger.debug(
      `Visiting AggregationNode comparing to AST node of type ${this.astCursor.currentNode.type}`
    );

    if (!aggregationNode.matches(this.astCursor)) {
      logger.debug("AST node does not match AggregationNode");
      throw new DoesNotMatch();
    }

    const aggregationRange = this.extractAggregationRangeFor(aggregationNode);
    this.aggregationToRangeMap[aggregationNode.name] = aggregationRange;

    if (aggregationNode.hasStartPattern) {
      const startMatch = this.findAggregationStartMatchFor(aggregationNode);
      if (!startMatch) {
        throw new DoesNotMatch();
      }
      this.aggregationToStartMatchMap[aggregationNode.name] = startMatch;
    }

    const aggregationPartMatches = this.findAggregationPartMatchesFor(aggregationNode);
    if (!aggregationPartMatches.length) {
      throw new DoesNotMatch();
    }
    this.aggregationToPartMatchesMap[aggregationNode.name] = aggregationPartMatches;
  }

  private extractAggregationRangeFor(aggregationNode: AggregationNode): CodeRange {
    const currentAstNode = this.astCursor.currentNode;
    return {
      node: currentAstNode,
      contextVariables: aggregationNode.contextVariables,
      from: currentAstNode.startIndex,
      to: currentAstNode.endIndex,
      language: this.pattern.language,
    };
  }

  private findAggregationStartMatchFor(aggregationNode: AggregationNode): Match | undefined {
    const pattern = this.pattern as AggregationDecorator;
    const aggregationName = aggregationNode.name;
    const startPatternMap = pattern.getStartPatternMapFor(aggregationName);
    if (startPatternMap) {
      const aggregationStartRange = this.extractAggregationStartRangeFor(aggregationNode);
      this.contextVariableRanges.push({
        from: aggregationStartRange.node.startIndex,
        to: aggregationStartRange.node.endIndex,
        contextVariables: aggregationStartRange.contextVariables,
      });

      const aggregationStartPatternMatching = new PatternMatching(
        startPatternMap,
        aggregationStartRange.node.walk(),
        Object.assign({}, this.contextVariables, aggregationStartRange.contextVariables)
      );
      const result = aggregationStartPatternMatching.executeOnlySpanningEntireRange();
      this.matchesBelow = this.matchesBelow.concat(result.matches.slice(1));
      return result.matches[0];
    }
  }

  private extractAggregationStartRangeFor(aggregationNode: AggregationNode): CodeRange {
    const currentAstNode = this.astCursor.currentNode;
    const aggregationStartRoot = currentAstNode.children[0];
    return {
      node: aggregationStartRoot,
      contextVariables: aggregationNode.contextVariables,
      from: aggregationStartRoot.startIndex,
      to: aggregationStartRoot.endIndex,
      language: this.pattern.language,
    };
  }

  private findAggregationPartMatchesFor(aggregationNode: AggregationNode): Match[] {
    const pattern = this.pattern as AggregationDecorator;
    const aggregationName = aggregationNode.name;
    const subPatternMap = pattern.getPartPatternsMapFor(aggregationName);
    const aggregationRanges = this.extractAggregationPartRangesFor(aggregationNode);
    this.aggregationToPartRangesMap[aggregationName] = aggregationRanges;
    const matches: Match[] = [];

    for (const aggregationRange of aggregationRanges) {
      this.contextVariableRanges.push({
        from: aggregationRange.node.startIndex,
        to: aggregationRange.node.endIndex,
        contextVariables: aggregationRange.contextVariables,
      });

      const aggregationPatternMatching = new PatternMatching(
        subPatternMap,
        aggregationRange.node.walk(),
        Object.assign({}, this.contextVariables, aggregationRange.contextVariables)
      );
      const result = aggregationPatternMatching.executeOnlySpanningEntireRange();
      const partMatch = result.matches[0];
      if (!partMatch) {
        continue;
      }
      matches.push(partMatch);
      this.matchesBelow = this.matchesBelow.concat(result.matches.slice(1));
      this.contextVariableRanges = this.contextVariableRanges.concat(result.contextVariableRanges);
    }

    return matches;
  }

  private extractAggregationPartRangesFor(aggregationNode: AggregationNode): CodeRange[] {
    const currentAstNode = this.astCursor.currentNode;

    let childNodes;
    if (aggregationNode.hasStartPattern) {
      childNodes = currentAstNode.children.slice(1, currentAstNode.children.length);
    } else {
      childNodes = currentAstNode.children;
    }

    const nodeTypeConfig = loadAggregatableNodeTypeConfigFor(
      aggregationNode.language,
      aggregationNode.astNodeType
    );

    const aggregationPartRoots = childNodes.filter((astNode) => {
      return !(
        astNode.text === nodeTypeConfig.startToken ||
        astNode.text === nodeTypeConfig.delimiterToken ||
        astNode.text === nodeTypeConfig.endToken
      );
    });

    return aggregationPartRoots.map((aggregationPartRoot) => ({
      node: aggregationPartRoot,
      contextVariables: aggregationNode.contextVariables,
      from: aggregationPartRoot.startIndex,
      to: aggregationPartRoot.endIndex,
      language: this.pattern.language,
    }));
  }

  private visitChainNode() {
    const chainNode = this.patternCursor.currentNode as ChainNode;
    logger.debug(
      `Visiting ChainNode comparing to AST node of type ${this.astCursor.currentNode.type}`
    );

    if (!chainNode.matches(this.astCursor)) {
      logger.debug("AST node does not match ChainNode");
      throw new DoesNotMatch();
    }
    if (this.astCursor.currentNode.hasChildren()) {
      this.visitChainNodeChildren();
    } else {
      logger.debug("ChainNode does not have children");
      throw new DoesNotMatch();
    }
  }

  private visitChainNodeChildren() {
    const chainNode = this.patternCursor.currentNode as ChainNode;

    const followedPaths = [];
    let chainDepth = -1;
    let numLinkMatches = 0;
    let chainableNodeTypeConfig;
    this.chainToLinkMatchesMap[chainNode.name] = [];
    do {
      chainDepth++;
      const currentAstNode = this.astCursor.currentNode;
      chainableNodeTypeConfig = loadChainableNodeTypeConfigFor(
        this.pattern.language,
        currentAstNode.type
      );
      if (chainableNodeTypeConfig) {
        const linkMatched = this.findLinkMatchFor(chainNode, chainableNodeTypeConfig);
        if (linkMatched) {
          logger.debug(`Found ${chainDepth + 1}. chain link`);
          numLinkMatches++;
          continue;
        }
      }
      const startMatched = this.findChainStartMatchFor(chainNode);
      if (startMatched) {
        logger.debug(`Reached chain start at depth ${chainDepth}`);
        break;
      }
      if (!chainableNodeTypeConfig && !startMatched) {
        throw new DoesNotMatch();
      }
    } while (
      this.astCursor.follow(chainableNodeTypeConfig.pathToNextLink) &&
      followedPaths.push(chainableNodeTypeConfig.pathToNextLink)
    );

    if (numLinkMatches < chainNode.minumumLength) {
      // We only match if at least two functions are called in a row
      logger.debug(
        `ChainNode does not match since only ${chainDepth + 1}` + `matching chainLinks were found`
      );
      throw new DoesNotMatch();
    }

    for (const path of followedPaths) {
      this.astCursor.reverseFollow(path);
    }
  }

  private findLinkMatchFor(
    chainNode: ChainNode,
    chainableNodeTypeConfig: ChainableNodeTypeConfig
  ): boolean {
    const pattern = this.pattern as ChainDecorator;
    const chainName = chainNode.name;
    const chainLinkPatterns = pattern.getLinkPatternMapFor(chainName);
    const chainLinkRange = this.extractChainLinkRangeFor(chainNode, chainableNodeTypeConfig);

    this.contextVariableRanges.push({
      from: chainLinkRange.node.startIndex,
      to: chainLinkRange.node.endIndex,
      contextVariables: chainLinkRange.contextVariables,
    });

    const chainLinkPatternMatching = new PatternMatching(
      chainLinkPatterns,
      chainLinkRange.node.walk(),
      Object.assign({}, this.contextVariables, chainLinkRange.contextVariables)
    );
    const result = chainLinkPatternMatching.executeOnlySpanningEntireRange();

    const linkMatch = result.matches[0];
    if (!linkMatch) {
      return false;
    }

    linkMatch.from = chainLinkRange.from;
    linkMatch.to = chainLinkRange.to;
    this.matchesBelow = this.matchesBelow.concat(result.matches.slice(1));
    this.chainToLinkMatchesMap[chainName].push(result.matches[0]);
    this.contextVariableRanges = this.contextVariableRanges.concat(result.contextVariableRanges);
    return true;
  }

  private extractChainLinkRangeFor(
    chainNode: ChainNode,
    chainableNodeTypeConfig: ChainableNodeTypeConfig
  ) {
    const succeded = this.astCursor.follow(chainableNodeTypeConfig.pathToLinkBegin);
    if (!succeded) {
      logger.debug(
        `AST node of type ${this.astCursor.currentNode.type} with text ${this.astCursor.currentNode.text} ` +
          `is not a valid chain node`
      );
      throw new DoesNotMatch();
    }
    const from = this.astCursor.currentNode.startIndex;
    this.astCursor.reverseFollow(chainableNodeTypeConfig.pathToLinkBegin);

    const currentAstNode = this.astCursor.currentNode;
    const linkRange = {
      node: currentAstNode,
      contextVariables: chainNode.contextVariables,
      from,
      to: currentAstNode.endIndex,
      language: this.pattern.language,
    };
    this.chainRanges.push(linkRange);
    return linkRange;
  }

  private findChainStartMatchFor(chainNode: ChainNode) {
    const pattern = this.pattern as ChainDecorator;
    const chainName = chainNode.name;
    const chainStartPatternMap = pattern.getStartPatternMapFor(chainName);
    const chainStartRange = this.extractChainStartRangeFor(chainNode);

    this.contextVariableRanges.push({
      from: chainStartRange.node.startIndex,
      to: chainStartRange.node.endIndex,
      contextVariables: chainStartRange.contextVariables,
    });

    const chainStartPatternMatching = new PatternMatching(
      chainStartPatternMap,
      chainStartRange.node.walk(),
      Object.assign({}, this.contextVariables, chainStartRange.contextVariables)
    );
    const result = chainStartPatternMatching.executeOnlySpanningEntireRange();
    if (!result.matches.length) {
      return false;
    }
    this.matchesBelow = this.matchesBelow.concat(result.matches.slice(1));
    this.chainToStartMatchMap[chainName] = result.matches[0];
    this.contextVariableRanges = this.contextVariableRanges.concat(result.contextVariableRanges);
    return true;
  }

  private extractChainStartRangeFor(chainNode: ChainNode) {
    const currentAstNode = this.astCursor.currentNode;
    const startRange = {
      node: currentAstNode,
      contextVariables: chainNode.contextVariables,
      from: currentAstNode.startIndex,
      to: currentAstNode.endIndex,
      language: this.pattern.language,
    };
    this.chainRanges.push(startRange);
    return startRange;
  }

  private visitChainContinuationNode() {
    const chainContinuationNode = this.patternCursor.currentNode as ChainContinuationNode;
    logger.debug(
      `Visiting ChainContinuationNode comparing to AST node of type ${this.astCursor.currentNode.type}`
    );

    if (!chainContinuationNode.matches(this.astCursor)) {
      logger.debug("AST node does not match ChainContinuationNode");
      throw new DoesNotMatch();
    }
  }

  private visitBlockNode() {
    const blockNode = this.patternCursor.currentNode as BlockNode;
    logger.debug(
      `Visiting BlockNode comparing to AST node of type ${this.astCursor.currentNode.type}`
    );

    if (!blockNode.matches(this.astCursor)) {
      logger.debug("AST does not match BlockNode");
      throw new DoesNotMatch();
    }
    const blockRange = this.extractBlockRangeFor(blockNode);
    this.blockRanges.push(blockRange);
  }

  private extractBlockRangeFor(blockNode: BlockNode): CodeRange {
    let from = this.astCursor.startIndex;
    if (this.pattern.language === Language.Python && this.lastSiblingKeyword?.type === ":") {
      from = this.lastSiblingKeyword.pos;
    }
    const rangeModifierStart = 1;
    const rangeModifierEnd = this.pattern.language === Language.TypeScript ? 1 : 0;
    return {
      from: from + rangeModifierStart,
      to: this.astCursor.endIndex - rangeModifierEnd,
      language: this.pattern.language,
      node: this.astCursor.currentNode,
      contextVariables: blockNode.contextVariables,
    };
  }

  private visitRegularNode() {
    const regularNode = this.patternCursor.currentNode as RegularNode;
    logger.debug(
      `Visiting RegularNode of type ${regularNode.type} comparing to AST node of type ${this.astCursor.currentNode.type}`
    );

    if (!regularNode.matches(this.astCursor, this.contextVariables)) {
      logger.debug("AST does not match RegularNode.");
      throw new DoesNotMatch();
    }

    const lookAheadPath = loadLookAheadPathFor(this.pattern.language, regularNode.type);
    if (
      lookAheadPath &&
      this.astCursor.follow(lookAheadPath) &&
      this.patternCursor.follow(lookAheadPath)
    ) {
      if (
        !(this.patternCursor.currentNode instanceof ArgumentNode) &&
        this.astCursor.currentNode.type === "identifier" &&
        this.astCursor.currentNode.text !== this.patternCursor.currentNode.text
      ) {
        throw new DoesNotMatch();
      } else {
        this.astCursor.reverseFollow(lookAheadPath);
        this.patternCursor.reverseFollow(lookAheadPath);
      }
    }

    if (regularNode.hasChildren()) {
      this.visitRegularNodeChildren();
    }
  }

  private visitRegularNodeChildren() {
    const regularNode = this.patternCursor.currentNode as RegularNode;
    this.patternCursor.goToFirstChild();
    this.astCursor.goToFirstChild();

    const requiredNumberOfChildren = regularNode.children!.length;
    for (let i = 0; i < requiredNumberOfChildren; i++) {
      this.recurse();

      if (this.astCursor.currentNode.isKeyword()) {
        this.lastSiblingKeyword = {
          type: this.astCursor.currentNode.type,
          pos: this.astCursor.currentNode.startIndex,
        };
      }

      if (i < requiredNumberOfChildren - 1) {
        this.patternCursor.goToNextSibling();
        const nextAstSiblingExists = this.astCursor.goToNextSibling();
        if (!nextAstSiblingExists) {
          logger.debug("AST Node has too few children");
          throw new DoesNotMatch();
        }
      }
    }

    if (this.astCursor.goToNextSibling()) {
      logger.debug("AST Node has too many children");
      throw new DoesNotMatch();
    }

    this.lastSiblingKeyword = null;
    this.astCursor.goToParent();
    this.patternCursor.goToParent();
  }

  private checkNoErrorToken() {
    if (this.astCursor.currentNode.isErrorToken()) {
      logger.debug("Error token in AST encountered");
      throw new DoesNotMatch();
    }
  }
}

export class DoesNotMatch extends Error {
  constructor(message?: string) {
    super(message);
  }
}
