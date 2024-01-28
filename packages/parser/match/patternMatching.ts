import type { TreeCursor } from "web-tree-sitter";
import type {
  ContextRange,
  PatternMatchingResult,
  Match,
  PatternMap,
  PatternNode,
} from "../types";
import type { Context } from "..";
import { CandidateMatch } from "./candidateMatch";
import AstCursor from "../ast/cursor";

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
        const firstMatch = this.findFirstMatchingCandidateForCurrentNode();
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

  private findFirstMatchingCandidateForCurrentNode():
    | CandidateMatch
    | undefined {
    const candidatePatterns = this.getCandidatePatternsForCurrentNode();

    for (const candidatePattern of candidatePatterns) {
      const candidateMatch = new CandidateMatch(
        candidatePattern,
        this.cursor.currentNode.walk(),
        this.context
      );
      candidateMatch.verify();

      if (candidateMatch.matched) {
        this.matches.push({
          pattern: candidatePattern,
          node: this.cursor.currentNode,
          args: candidateMatch.args,
          blocks: candidateMatch.blocks,
        });
        return candidateMatch;
      }
    }
  }

  private getCandidatePatternsForCurrentNode(): PatternNode[] {
    return this.patternMap[this.cursor.currentNode.type];
  }

  private findMatchesInBlocksOf(candidateMatch: CandidateMatch): void {
    for (const block of candidateMatch.blocks) {
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
