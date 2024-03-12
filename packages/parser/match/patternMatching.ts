import type {
  ContextVariableRange,
  PatternMatchingResult,
  Match,
  CandidateMatch,
  VerificationResult,
  CodeRange,
  PatternsMap,
  MatchesMap,
} from "./types";
import MatchVerification, { DoesNotMatch } from "./matchVerification";
import AstCursor from "../ast/cursor";
import Pattern from "../pattern/pattern";
import { TreeCursor } from "web-tree-sitter";
import AggregationDecorator from "../pattern/decorators/aggregationDecorator";
import ChainDecorator from "../pattern/decorators/chainDecorator";
import { ContextVariableMap } from "@puredit/projections";
import CommentContextExtraction from "./commentContextExtraction";

import { logProvider } from "../../../logconfig";
const logger = logProvider.getLogger("parser.match.PatternMatching");

export class PatternMatching {
  // Input
  private patternMap: PatternsMap;
  private astCursor: AstCursor;
  private contextVariables: ContextVariableMap;

  // Output
  private matches: Match[] = [];
  private contextVariableRanges: ContextVariableRange[] = [];

  constructor(
    patternMap: PatternsMap,
    cursor: AstCursor | TreeCursor,
    contextVariables: ContextVariableMap = {}
  ) {
    this.patternMap = patternMap;
    this.contextVariables = contextVariables;
    if (!(cursor instanceof AstCursor)) {
      this.astCursor = new AstCursor(cursor);
    } else {
      this.astCursor = cursor;
    }
  }

  execute(): PatternMatchingResult {
    logger.debug("Starting new pattern matching");

    do {
      const candidateMatches = this.getCandidateMatches();
      const verificationResult = this.verify(candidateMatches);
      if (verificationResult) {
        this.postProcess(verificationResult);
      } else {
        this.findMatchesInFirstChild();
      }
    } while (this.astCursor.goToNextSibling());

    return {
      matches: this.matches,
      contextVariableRanges: this.contextVariableRanges,
    };
  }

  private getCandidateMatches(): CandidateMatch[] {
    const fittingPatterns = this.patternMap[this.astCursor.currentNode.cleanNodeType] || [];
    const sortedCandidatePatterns = this.sortByPriority(fittingPatterns);
    const candidateMatches: CandidateMatch[] = sortedCandidatePatterns.map((candidatePattern) => ({
      pattern: candidatePattern,
      cursor: this.astCursor.currentNode.walk(),
      contextVariables: this.contextVariables,
    }));

    logger.debug(`Found ${candidateMatches.length} candidate matches`);
    return candidateMatches;
  }

  private sortByPriority(patterns: Pattern[]): Pattern[] {
    return [...patterns].sort((a: Pattern, b: Pattern) => {
      if (a.priority < b.priority) {
        return -1;
      } else if (a.priority > b.priority) {
        return 1;
      }
      return 0;
    });
  }

  private verify(candidateMatches: CandidateMatch[]): VerificationResult | undefined {
    for (const candidateMatch of candidateMatches) {
      const candidateMatchVerification = new MatchVerification(candidateMatch);
      let verificationResult;
      try {
        verificationResult = candidateMatchVerification.execute();
      } catch (error) {
        if (error instanceof DoesNotMatch) {
          continue;
        } else {
          throw error;
        }
      }
      logger.debug(
        `Pattern ${verificationResult.pattern.name} ` +
          `matched AST node with text ${this.astCursor.currentNode.text}`
      );
      return verificationResult;
    }
  }

  private postProcess(verificationResult: VerificationResult): void {
    logger.debug(
      `Postprocessing verification result with pattern ${verificationResult.pattern.name}`
    );
    const contextInformation = this.extractContextInformation(verificationResult);
    const aggregationRanges = this.getAggregationRangesOf(verificationResult);
    const chainRanges = this.getChainRangesOf(verificationResult);
    const aggregationToMatchesMap = this.findMatchesInAggregationRangesOf(verificationResult);

    this.matches.push({
      pattern: verificationResult.pattern,
      node: this.astCursor.currentNode,
      from: this.astCursor.currentNode.startIndex,
      to: this.astCursor.currentNode.endIndex,
      argsToAstNodeMap: verificationResult.argsToAstNodeMap,
      aggregationRanges,
      chainRanges,
      blockRanges: verificationResult.blockRanges,
      contextInformation,
      aggregationToMatchesMap,
    });

    this.findMatchesInChainStartRangesOf(verificationResult);
    this.findMatchesInChainLinkRangesOf(verificationResult);
    this.findMatchesInBlockRangesOf(verificationResult);
  }

  private extractContextInformation(verificationResult: VerificationResult) {
    const commentContextExtraction = new CommentContextExtraction(verificationResult);
    const commentContext = commentContextExtraction.execute();
    if (commentContext) {
      return { commentContext };
    } else {
      return {};
    }
  }

  private getAggregationRangesOf(verificationResult: VerificationResult): CodeRange[] {
    return Object.values(verificationResult.aggregationToRangesMap).reduce(
      (previousAggregationRanges: CodeRange[], currentAggregationRange: CodeRange[]) => {
        return previousAggregationRanges.concat(currentAggregationRange);
      },
      []
    );
  }

  private getChainRangesOf(verificationResult: VerificationResult): CodeRange[] {
    const chainRanges = Object.values(verificationResult.chainToStartRangeMap).reduce(
      (startRanges: CodeRange[], currentStartRange: CodeRange) => {
        return startRanges.concat(currentStartRange);
      },
      []
    );
    return Object.values(verificationResult.chainToLinkRangesMap).reduce(
      (previousChainRanges: CodeRange[], newLinkRanges: CodeRange[]) => {
        return previousChainRanges.concat(newLinkRanges);
      },
      chainRanges
    );
  }

  private findMatchesInAggregationRangesOf(verificationResult: VerificationResult): MatchesMap {
    const matchesMap = {} as MatchesMap;
    if (!(verificationResult.pattern instanceof AggregationDecorator)) {
      return matchesMap;
    }
    for (const aggregationName in verificationResult.aggregationToRangesMap) {
      const aggregationMatches = this.findAggregationMatchesFor(
        aggregationName,
        verificationResult
      );
      matchesMap[aggregationName] = aggregationMatches;
    }
    return matchesMap;
  }

  private findAggregationMatchesFor(
    aggregationName: string,
    verificationResult: VerificationResult
  ): Match[] {
    const pattern = verificationResult.pattern as AggregationDecorator;
    const subPatternMap = pattern.getAggregationPatternMapFor(aggregationName);
    const aggregationRanges = verificationResult.aggregationToRangesMap[aggregationName];
    let matches: Match[] = [];

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

      matches = matches.concat(result.matches);
      this.contextVariableRanges = this.contextVariableRanges.concat(result.contextVariableRanges);
    }

    this.matches = this.matches.concat(matches);
    return matches;
  }

  private findMatchesInBlockRangesOf(verificationResult: VerificationResult): void {
    for (const blockRange of verificationResult.blockRanges) {
      this.contextVariableRanges.push({
        from: blockRange.node.startIndex,
        to: blockRange.node.endIndex,
        contextVariables: blockRange.contextVariables,
      });

      const blockPatternMatching = new PatternMatching(
        this.patternMap,
        blockRange.node.walk(),
        Object.assign({}, this.contextVariables, blockRange.contextVariables)
      );
      const result = blockPatternMatching.execute();

      this.matches = this.matches.concat(result.matches);
      this.contextVariableRanges = this.contextVariableRanges.concat(result.contextVariableRanges);
    }
  }

  private findMatchesInChainStartRangesOf(verificationResult: VerificationResult): void {
    if (!(verificationResult.pattern instanceof ChainDecorator)) {
      return;
    }
    for (const chainName in verificationResult.chainToStartRangeMap) {
      this.findStartMatchForChain(chainName, verificationResult);
    }
  }

  private findStartMatchForChain(chainName: string, verificationResult: VerificationResult): void {
    const pattern = verificationResult.pattern as ChainDecorator;
    const chainStartPatternMap = pattern.getStartPatternMapFor(chainName);
    const chainStartRange = verificationResult.chainToStartRangeMap[chainName];

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
    this.matches = this.matches.concat(result.matches);
    this.contextVariableRanges = this.contextVariableRanges.concat(result.contextVariableRanges);
  }

  private findMatchesInChainLinkRangesOf(verificationResult: VerificationResult): void {
    if (!(verificationResult.pattern instanceof ChainDecorator)) {
      return;
    }
    for (const chainName in verificationResult.chainToLinkRangesMap) {
      this.findLinkMatchesForChain(chainName, verificationResult);
    }
  }

  private findLinkMatchesForChain(chainName: string, verificationResult: VerificationResult) {
    const pattern = verificationResult.pattern as ChainDecorator;
    const chainLinkPatterns = pattern.getLinkPatternMapFor(chainName);
    const chainLinkRanges = verificationResult.chainToLinkRangesMap[chainName];

    for (const chainLinkRange of chainLinkRanges) {
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

      result.matches
        .filter((match) => pattern.getAllLinkPatterns().includes(match.pattern))
        .forEach((match) => {
          match.from = chainLinkRange.from;
          match.to = chainLinkRange.to;
        });

      this.matches = this.matches.concat(result.matches);
      this.contextVariableRanges = this.contextVariableRanges.concat(result.contextVariableRanges);
    }
  }

  private findMatchesInFirstChild(): void {
    if (this.astCursor.goToFirstChild()) {
      const childPatternMatching = new PatternMatching(
        this.patternMap,
        this.astCursor,
        this.contextVariables
      );
      const result = childPatternMatching.execute();
      this.matches = this.matches.concat(result.matches);
      this.contextVariableRanges = this.contextVariableRanges.concat(result.contextVariableRanges);

      this.astCursor.goToParent();
    }
  }

  executeOnlySpanningEntireRange(): PatternMatchingResult {
    logger.debug("Starting new pattern matching only spanning entire range");
    const candidateMatches = this.getCandidateMatches();
    const verificationResult = this.verify(candidateMatches);
    if (verificationResult) {
      this.postProcess(verificationResult);
    }
    return {
      matches: this.matches,
      contextVariableRanges: this.contextVariableRanges,
    };
  }
}
