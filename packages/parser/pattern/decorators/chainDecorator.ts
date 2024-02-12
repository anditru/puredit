import Pattern from "../pattern";
import PatternDecorator from "./patternDecorator";
import { SubPatternMap } from "../types";
import { createPatternMap } from "../../common";
import { PatternMap } from "../../match/types";

export default class ChainDecorator extends PatternDecorator {
  constructor(
    pattern: Pattern,
    private startPatternMap: Record<string, Pattern>,
    private linkPatternMap: SubPatternMap
  ) {
    super(pattern);
  }

  getStartPatternMapFor(chainName: string): PatternMap {
    const startPattern = this.startPatternMap[chainName];
    if (!startPattern) {
      throw new Error(`Chain with name ${chainName} not found`);
    }
    return createPatternMap([startPattern]);
  }

  getLinkPatternMapFor(chainName: string): PatternMap {
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
