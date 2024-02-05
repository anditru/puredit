import type { ContextRange, PatternMatchingResult, Match, PatternMap } from "./types";
import type { Context } from "..";
import MatchVerification, { DoesNotMatch } from "./matchVerification";
import AstCursor from "../ast/cursor";
import Pattern from "../pattern/pattern";
import { TreeCursor } from "web-tree-sitter";
import AggregationDecorator from "../pattern/decorators/aggregationDecorator";

export class PatternMatching {
  private matches: Match[] = [];
  private contextRanges: ContextRange[] = [];
  private cursor: AstCursor;

  constructor(
    private patternMap: PatternMap,
    cursor: AstCursor | TreeCursor,
    private context: Context = {},
    private to = Infinity
  ) {
    if (!(cursor instanceof AstCursor)) {
      this.cursor = new AstCursor(cursor);
    } else {
      this.cursor = cursor;
    }
  }

  execute(): PatternMatchingResult {
    do {
      if (this.candidatePatternsExistForCurrentNode()) {
        const firstMatch = this.findFirstMatchForCurrentNode();
        if (firstMatch) {
          const firstMatchWithAggregationMatches =
            this.findMatchesInAggregationRangesOf(firstMatch);
          this.findMatchesInBlockRangesOf(firstMatchWithAggregationMatches);
          continue;
        }
      }
      this.findMatchesInFirstChild();
    } while (this.cursor.goToNextSibling() && this.cursor.startIndex < this.to);

    return { matches: this.matches, contextRanges: this.contextRanges };
  }

  private candidatePatternsExistForCurrentNode(): boolean {
    return this.getCandidatePatternsForCurrentNode().length > 0;
  }

  private findFirstMatchForCurrentNode(): Match | undefined {
    const candidatePatterns = this.getCandidatePatternsForCurrentNode();

    for (const candidatePattern of candidatePatterns) {
      const candidateMatch = {
        pattern: candidatePattern,
        cursor: this.cursor.currentNode.walk(),
        context: this.context,
      };
      const candidateMatchVerification = new MatchVerification(candidateMatch);

      let match;
      try {
        match = candidateMatchVerification.execute();
      } catch (error) {
        if (!(error instanceof DoesNotMatch)) {
          throw error;
        }
        continue;
      }

      this.matches.push(match);
      return match;
    }
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

  private getCandidatePatternsForCurrentNode(): Pattern[] {
    const exactlyFittingPatterns = this.patternMap[this.cursor.currentNode.type] || [];
    const wildCardRootNodePatterns = this.patternMap["*"] || [];
    const candidatePatterns = exactlyFittingPatterns.concat(wildCardRootNodePatterns);
    return this.sortByPriority(candidatePatterns);
  }

  private findMatchesInBlockRangesOf(match: Match): void {
    for (const blockRange of match.blockRanges) {
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

  private findMatchesInAggregationRangesOf(match: Match): Match {
    if (!(match.pattern instanceof AggregationDecorator)) {
      match;
    }

    const pattern = match.pattern as AggregationDecorator;
    for (const aggregationName in match.aggregationRangeMap) {
      const subPatternMap = pattern.getSubPatternMapFor(aggregationName);
      const aggregationRanges = match.aggregationRangeMap[aggregationName];
      match.aggregationMatchMap[aggregationName] = [];

      for (const aggregationRange of aggregationRanges) {
        const aggregationPatternMatching = new PatternMatching(
          subPatternMap,
          aggregationRange.node.walk(),
          Object.assign({}, this.context, aggregationRange.context)
        );
        const result = aggregationPatternMatching.execute();
        match.aggregationMatchMap[aggregationName] = match.aggregationMatchMap[
          aggregationName
        ].concat(result.matches);
      }
    }
    return match;
  }

  private findMatchesInFirstChild(): void {
    if (this.cursor.goToFirstChild()) {
      const childPatternMatching = new PatternMatching(
        this.patternMap,
        this.cursor,
        this.context,
        this.to
      );
      const result = childPatternMatching.execute();
      this.matches = this.matches.concat(result.matches);
      this.contextRanges = this.contextRanges.concat(result.contextRanges);

      this.cursor.goToParent();
    }
  }
}
