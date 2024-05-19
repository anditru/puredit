import type {
  ContextVariableRange,
  PatternMatchingResult,
  Match,
  CandidateMatch,
  VerificationResult,
  PatternsMap,
} from "./types";
import MatchVerification, { DoesNotMatch } from "./matchVerification";
import AstCursor from "../ast/cursor";
import Pattern from "../pattern/pattern";
import { TreeCursor } from "web-tree-sitter";
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
    this.matches.push({
      pattern: verificationResult.pattern,
      node: this.astCursor.currentNode,
      from: this.astCursor.currentNode.startIndex,
      to: this.astCursor.currentNode.endIndex,
      argsToAstNodeMap: verificationResult.argsToAstNodeMap,
      chainRanges: verificationResult.chainRanges,
      blockRanges: verificationResult.blockRanges,
      contextInformation,
      aggregationPartRanges: verificationResult.aggregationPartRanges,
      aggregationToRangeMap: verificationResult.aggregationToRangeMap,
      aggregationToStartMatchMap: verificationResult.aggregationToStartMatchMap,
      aggregationToPartMatchesMap: verificationResult.aggregationToPartMatchesMap,
    });

    const chainStartMatches = Object.values(verificationResult.chainToStartMatchMap).reduce(
      (prev: Match[], curr: Match) => prev.concat(curr),
      []
    );
    const chainLinkMatches = Object.values(verificationResult.chainToLinkMatchesMap).reduce(
      (prev: Match[], curr: Match[]) => prev.concat(curr),
      []
    );
    const aggregationStartMatches = Object.values(
      verificationResult.aggregationToStartMatchMap
    ).reduce((prev: Match[], curr: Match) => prev.concat(curr), []);
    const aggregationPartMatches = Object.values(
      verificationResult.aggregationToPartMatchesMap
    ).reduce((prev: Match[], curr: Match[]) => prev.concat(curr), []);
    this.matches = this.matches.concat(
      chainStartMatches,
      chainLinkMatches,
      aggregationStartMatches,
      aggregationPartMatches
    );
    this.matches = this.matches.concat(verificationResult.matchesBelow);
    this.contextVariableRanges = this.contextVariableRanges.concat(
      verificationResult.contextVariableRanges
    );

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
