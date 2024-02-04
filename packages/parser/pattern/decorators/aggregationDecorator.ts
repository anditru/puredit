import Pattern from "../pattern";
import PatternDecorator from "./patternDecorator";
import { SubPatternMap } from "../types";

export default class AggregationDecorator extends PatternDecorator {
  constructor(pattern: Pattern, private aggregationPatternMap: SubPatternMap) {
    super(pattern);
  }

  hasAggregations(): boolean {
    return !!this.aggregationPatternMap;
  }
}
