import Pattern from "../pattern";
import PatternDecorator from "./patternDecorator";
import { createPatternMap } from "../../common";
import { PatternMap, PatternsMap } from "../../match/types";

export default class ChainDecorator extends PatternDecorator {
  constructor(
    pattern: Pattern,
    private startPatternMap: PatternMap,
    private linkPatternMap: PatternsMap
  ) {
    super(pattern);
  }

  getStartPatternMapFor(chainName: string): PatternsMap {
    const startPattern = this.startPatternMap[chainName];
    if (!startPattern) {
      throw new Error(`Chain with name ${chainName} not found`);
    }
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

  hasChains(): boolean {
    return !!this.startPatternMap && !!this.linkPatternMap;
  }
}
