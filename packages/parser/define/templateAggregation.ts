import AstCursor from "../ast/cursor";
import RawTemplate from "./rawTemplate";
import { Context } from "../types";
import TemplateParameter from "./templateParameter";
import PatternNode from "../pattern/patternNode";

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
    return this.allowedPatterns.map((pattern: RawTemplate) =>
      pattern.toCodeString()
    );
  }

  toPatternNode(cursor: AstCursor): PatternNode {
    throw new Error("Method not implemented.");
  }
}

export enum AggregationCardinality {
  ZeroToOne = "0..1",
  ZeroToMany = "0..n",
  OneToMany = "1..n",
}
