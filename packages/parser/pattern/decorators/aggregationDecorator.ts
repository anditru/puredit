import Pattern from "../pattern";
import PatternDecorator from "./patternDecorator";
import { createPatternMap } from "../../common";
import { PatternMap, PatternsMap } from "../../match/types";

export default class AggregationDecorator extends PatternDecorator {
  constructor(
    pattern: Pattern,
    private partPatternMap: PatternsMap,
    private specialStartPatternMap: PatternMap,
    private aggregationTypeMap: Record<string, string>
  ) {
    super(pattern);
  }

  getStartPatternMapFor(aggregationName: string): PatternsMap | undefined {
    const startPattern = this.specialStartPatternMap[aggregationName];
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

  getPartPatternsFor(aggregationName: string): Pattern[] {
    return this.partPatternMap[aggregationName];
  }

  getNodeTypeFor(aggregationName: string): string {
    return this.aggregationTypeMap[aggregationName];
  }

  hasAggregations(): boolean {
    return !!this.partPatternMap;
  }
}
