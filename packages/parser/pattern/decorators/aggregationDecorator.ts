import Pattern from "../pattern";
import PatternDecorator from "./patternDecorator";
import { createPatternMap } from "../../common";
import { PatternMap, PatternsMap } from "../../match/types";
import TemplateAggregation from "../../template/parameters/templateAggregation";

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

  addPartPattern(aggregationName: string, pattern: Pattern) {
    const partPatterns = this.partPatternMap[aggregationName];
    if (!partPatterns) {
      throw new Error(`Aggregation with name ${aggregationName} not found`);
    }
    partPatterns.push(pattern);
  }

  getAggregation(name: string): TemplateAggregation | undefined {
    return this.template.params.find(
      (param) => param instanceof TemplateAggregation && param.name === name
    ) as TemplateAggregation;
  }

  hasAggregations(): boolean {
    return !!this.partPatternMap;
  }
}
