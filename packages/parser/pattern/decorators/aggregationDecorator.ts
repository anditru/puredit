import Pattern from "../pattern";
import PatternDecorator from "./patternDecorator";
import { createPatternMap } from "../../common";
import { PatternMap, PatternsMap } from "../../match/types";

export default class AggregationDecorator extends PatternDecorator {
  constructor(
    pattern: Pattern,
    private partPatternMap: PatternsMap,
    private startPatternMap: PatternMap,
    private aggregationTypeMap: Record<string, string>
  ) {
    super(pattern);
  }

  getStartPatternMapFor(aggregationName: string): PatternsMap | undefined {
    const startPattern = this.startPatternMap[aggregationName];
    if (startPattern) {
      return createPatternMap([startPattern]);
    }
  }

  getPartPatternsMapFor(aggregationName: string): PatternsMap {
    const partPatterns = this.partPatternMap[aggregationName];
    if (!partPatterns) {
      throw new Error(`Aggregation with name ${aggregationName} not found`);
    }
    return createPatternMap(partPatterns);
  }

  getStartPatternFor(aggregationName: string): Pattern {
    return this.startPatternMap[aggregationName];
  }

  getPartPatternsFor(aggregationName: string): Pattern[] {
    return this.partPatternMap[aggregationName];
  }

  getNodeTypeFor(aggregationName: string): string {
    return this.aggregationTypeMap[aggregationName];
  }

  addPartPattern(aggregationName: string, pattern: Pattern) {
    const partPatterns = this.partPatternMap[aggregationName];
    if (!partPatterns) {
      throw new Error(`Aggregation with name ${aggregationName} not found`);
    }
    partPatterns.push(pattern);
  }

  getSubPatterns(): Pattern[] {
    let subPatterns: Pattern[] = [];
    Object.values(this.startPatternMap).forEach((pattern) => {
      subPatterns.push(pattern);
      subPatterns = subPatterns.concat(pattern.getSubPatterns());
    });
    Object.values(this.partPatternMap).forEach((patterns) => {
      patterns.forEach((pattern) => {
        subPatterns.push(pattern);
        subPatterns = subPatterns.concat(pattern.getSubPatterns());
      });
    });
    return subPatterns;
  }
}
