import type { ContextRange, PatternMatchingResult, Match, PatternMap } from "./types";
import type { Context } from "..";
import CandidateMatchVerification, { DoesNotMatch } from "./candidateMatchVerification";
import AstCursor from "../ast/cursor";
import Pattern from "../pattern/pattern";
import { TreeCursor } from "web-tree-sitter";

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
          this.findMatchesInBlocksOf(firstMatch);
          continue;
        }
      }
      this.findMatchesInFirstChild();
    } while (this.cursor.goToNextSibling() && this.cursor.startIndex < this.to);

    return { matches: this.matches, contextRanges: this.contextRanges };
  }

  private candidatePatternsExistForCurrentNode(): boolean {
    return !!this.patternMap[this.cursor.currentNode.type];
  }

  private findFirstMatchForCurrentNode(): Match | undefined {
    const candidatePatterns = this.getCandidatePatternsForCurrentNode();

    for (const candidatePattern of candidatePatterns) {
      const candidateMatch = {
        pattern: candidatePattern,
        cursor: this.cursor.currentNode.walk(),
        context: this.context,
      };
      const candidateMatchVerification = new CandidateMatchVerification(candidateMatch);

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

  private getCandidatePatternsForCurrentNode(): Pattern[] {
    return this.patternMap[this.cursor.currentNode.type];
  }

  private findMatchesInBlocksOf(match: Match): void {
    for (const block of match.blockRanges) {
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
