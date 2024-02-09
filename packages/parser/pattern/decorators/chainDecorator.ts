import Pattern from "../pattern";
import PatternDecorator from "./patternDecorator";
import { SubPatternMap } from "../types";
import { createPatternMap } from "../../common";
import { PatternMap } from "../../match/types";

export default class ChainDecorator extends PatternDecorator {
  constructor(pattern: Pattern, private chainPatternMap: SubPatternMap) {
    super(pattern);
  }

  getChainPatternMapFor(chainName: string): PatternMap {
    const subPatterns = this.chainPatternMap[chainName];
    if (!subPatterns) {
      throw new Error(`Chain with name ${chainName} not found`);
    }
    return createPatternMap(subPatterns);
  }

  hasAggregations(): boolean {
    return !!this.chainPatternMap;
  }
}
