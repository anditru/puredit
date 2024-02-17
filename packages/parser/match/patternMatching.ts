import type {
  ContextRange,
  PatternMatchingResult,
  Match,
  PatternMap,
  CandidateMatch,
  VerificationResult,
  CodeRange,
} from "./types";
import type { Context } from "..";
import MatchVerification, { DoesNotMatch } from "./matchVerification";
import AstCursor from "../ast/cursor";
import Pattern from "../pattern/pattern";
import { TreeCursor } from "web-tree-sitter";
import AggregationDecorator from "../pattern/decorators/aggregationDecorator";
import ChainDecorator from "../pattern/decorators/chainDecorator";

export class PatternMatching {
  private matches: Match[] = [];
  private contextRanges: ContextRange[] = [];
  private astCursor: AstCursor;

  constructor(
    private patternMap: PatternMap,
    cursor: AstCursor | TreeCursor,
    private context: Context = {}
  ) {
    if (!(cursor instanceof AstCursor)) {
      this.astCursor = new AstCursor(cursor);
    } else {
      this.astCursor = cursor;
    }
  }

  execute(): PatternMatchingResult {
    do {
      const candidateMatches = this.getCandidateMatches();
      const verificationResult = this.verify(candidateMatches);
      if (verificationResult) {
        this.postProcess(verificationResult);
        continue;
      }
      this.findMatchesInFirstChild();
    } while (this.astCursor.goToNextSibling());

    return { matches: this.matches, contextRanges: this.contextRanges };
  }

  private getCandidateMatches(): CandidateMatch[] {
    const exactlyFittingPatterns = this.patternMap[this.astCursor.currentNode.type] || [];
    const wildCardRootNodePatterns = this.patternMap["*"] || [];
    const candidatePatterns = exactlyFittingPatterns.concat(wildCardRootNodePatterns);

    const sortedCandidatePatterns = this.sortByPriority(candidatePatterns);
    return sortedCandidatePatterns.map((candidatePattern) => ({
      pattern: candidatePattern,
      cursor: this.astCursor.currentNode.walk(),
      context: this.context,
    }));
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
      try {
        return candidateMatchVerification.execute();
      } catch (error) {
        if (!(error instanceof DoesNotMatch)) {
          throw error;
        }
        continue;
      }
    }
  }

  private postProcess(verificationResult: VerificationResult): void {
    const aggregationRanges = this.getAggregationRangesOf(verificationResult);
    const chainRanges = this.getChainRangesOf(verificationResult);

    this.matches.push({
      pattern: verificationResult.pattern,
      node: this.astCursor.currentNode,
      from: this.astCursor.currentNode.startIndex,
      to: this.astCursor.currentNode.endIndex,
      argsToAstNodeMap: verificationResult.argsToAstNodeMap,
      aggregationRanges,
      chainRanges,
      blockRanges: verificationResult.blockRanges,
    });

    this.findMatchesInAggregationRangesOf(verificationResult);
    this.findMatchesInChainStartRangesOf(verificationResult);
    this.findMatchesInChainLinkRangesOf(verificationResult);
    this.findMatchesInBlockRangesOf(verificationResult);
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

  private findMatchesInAggregationRangesOf(verificationResult: VerificationResult): void {
    if (!(verificationResult.pattern instanceof AggregationDecorator)) {
      return;
    }
    for (const aggregationName in verificationResult.aggregationToRangesMap) {
      this.findAggregationMatchesFor(aggregationName, verificationResult);
    }
  }

  private findAggregationMatchesFor(
    aggregationName: string,
    verificationResult: VerificationResult
  ) {
    const pattern = verificationResult.pattern as AggregationDecorator;
    const subPatternMap = pattern.getAggregationPatternMapFor(aggregationName);
    const aggregationRanges = verificationResult.aggregationToRangesMap[aggregationName];

    for (const aggregationRange of aggregationRanges) {
      const aggregationPatternMatching = new PatternMatching(
        subPatternMap,
        aggregationRange.node.walk(),
        Object.assign({}, this.context, aggregationRange.context)
      );
      const result = aggregationPatternMatching.executeOnlySpanningEntireRange();

      this.matches = this.matches.concat(result.matches);
      this.contextRanges = this.contextRanges.concat(result.contextRanges);
    }
  }

  private findMatchesInBlockRangesOf(verificationResult: VerificationResult): void {
    for (const blockRange of verificationResult.blockRanges) {
      this.contextRanges.push({
        from: blockRange.node.startIndex,
        to: blockRange.node.endIndex,
        context: blockRange.context,
      });

      const blockPatternMatching = new PatternMatching(
        this.patternMap,
        blockRange.node.walk(),
        Object.assign({}, this.context, blockRange.context)
      );
      const result = blockPatternMatching.execute();

      this.matches = this.matches.concat(result.matches);
      this.contextRanges = this.contextRanges.concat(result.contextRanges);
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

    const chainStartPatternMatching = new PatternMatching(
      chainStartPatternMap,
      chainStartRange.node.walk(),
      Object.assign({}, this.context, chainStartRange.context)
    );
    const result = chainStartPatternMatching.executeOnlySpanningEntireRange();
    this.matches = this.matches.concat(result.matches);
    this.contextRanges = this.contextRanges.concat(result.contextRanges);
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
      const chainLinkPatternMatching = new PatternMatching(
        chainLinkPatterns,
        chainLinkRange.node.walk(),
        Object.assign({}, this.context, chainLinkRange.context)
      );
      const result = chainLinkPatternMatching.executeOnlySpanningEntireRange();

      result.matches.forEach((match) => {
        match.from = chainLinkRange.from;
        match.to = chainLinkRange.to;
      });
      this.matches = this.matches.concat(result.matches);
      this.contextRanges = this.contextRanges.concat(result.contextRanges);
    }
  }

  private findMatchesInFirstChild(): void {
    if (this.astCursor.goToFirstChild()) {
      const childPatternMatching = new PatternMatching(
        this.patternMap,
        this.astCursor,
        this.context
      );
      const result = childPatternMatching.execute();
      this.matches = this.matches.concat(result.matches);
      this.contextRanges = this.contextRanges.concat(result.contextRanges);

      this.astCursor.goToParent();
    }
  }

  executeOnlySpanningEntireRange() {
    const candidateMatches = this.getCandidateMatches();
    const verificationResult = this.verify(candidateMatches);
    if (verificationResult) {
      this.postProcess(verificationResult);
    }
    return { matches: this.matches, contextRanges: this.contextRanges };
  }
}
