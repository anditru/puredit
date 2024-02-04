import AstCursor from "../ast/cursor";
import RawTemplate from "./rawTemplate";
import { Context } from "../match/types";
import TemplateParameter from "./templateParameter";
import PatternNode from "../pattern/nodes/patternNode";
import { Target } from "../treeSitterParser";
import AggregationNode from "../pattern/nodes/aggregationNode";

export default class TemplateAggregation extends TemplateParameter {
  static readonly CODE_STRING_PREFIX = "__template_agg_";

  constructor(
    public readonly name: string,
    public readonly allowedPatterns: RawTemplate[],
    public readonly cardinality: AggregationCardinality,
    public readonly context?: Context,
    public readonly separatorToken?: string
  ) {
    super();
  }

  toCodeString(): string {
    if (this._id === undefined) {
      this._id = TemplateParameter.issueId();
    }
    return TemplateAggregation.CODE_STRING_PREFIX + this._id.toString();
  }

  getCodeStringsForParts(): string[] {
    return this.allowedPatterns.map((pattern: RawTemplate) => pattern.toCodeString());
  }

  toPatternNode(cursor: AstCursor, language: Target): PatternNode {
    return new AggregationNode(language, cursor.currentNode.text, cursor.currentFieldName, this);
  }
}

export enum AggregationCardinality {
  ZeroToOne = "0..1",
  ZeroToMany = "0..n",
  OneToMany = "1..n",
}
