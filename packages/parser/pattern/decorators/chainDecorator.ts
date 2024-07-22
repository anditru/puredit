import Pattern from "../pattern";
import PatternDecorator from "./patternDecorator";
import { createPatternMap } from "../../common";
import { PatternMap, PatternsMap } from "../../match/types";

/**
 * @class Decorator the extend a BasePattern with the functionality required
 * if it contains at least one chain.
 */
export default class ChainDecorator extends PatternDecorator {
  constructor(
    pattern: Pattern,
    private startPatternMap: PatternMap,
    private linkPatternMap: PatternsMap
  ) {
    super(pattern);
  }

  getStartPatternFor(chainName: string): Pattern {
    const startPattern = this.startPatternMap[chainName];
    if (!startPattern) {
      throw new Error(`Chain with name ${chainName} not found`);
    }
    return startPattern;
  }

  getLinkPatternsFor(chainName: string): Pattern[] {
    const linkPatterns = this.linkPatternMap[chainName];
    if (!linkPatterns) {
      throw new Error(`Chain with name ${chainName} not found`);
    }
    return linkPatterns;
  }

  getStartPatternMapFor(chainName: string): PatternsMap {
    const startPattern = this.getStartPatternFor(chainName);
    return createPatternMap([startPattern]);
  }

  getAllLinkPatterns(): Pattern[] {
    return Object.values(this.linkPatternMap).reduce(
      (allLinkPatterns: Pattern[], currentLinkPatterns: Pattern[]) => {
        return allLinkPatterns.concat(currentLinkPatterns);
      },
      []
    );
  }

  getLinkPatternMapFor(chainName: string): PatternsMap {
    const linkPatterns = this.linkPatternMap[chainName];
    if (!linkPatterns) {
      throw new Error(`Chain with name ${chainName} not found`);
    }
    return createPatternMap(linkPatterns);
  }

  addLinkPattern(chainName: string, pattern: Pattern) {
    const linkPatterns = this.linkPatternMap[chainName];
    if (!linkPatterns) {
      throw new Error(`Chain with name ${chainName} not found`);
    }
    linkPatterns.push(pattern);
  }

  getSubPatterns(): Pattern[] {
    let subPatterns: Pattern[] = [];
    Object.values(this.startPatternMap).forEach((pattern) => {
      subPatterns.push(pattern);
      subPatterns = subPatterns.concat(pattern.getSubPatterns());
    });
    Object.values(this.linkPatternMap).forEach((patterns) => {
      patterns.forEach((pattern) => {
        subPatterns.push(pattern);
        subPatterns = subPatterns.concat(pattern.getSubPatterns());
      });
    });
    return subPatterns;
  }
}
