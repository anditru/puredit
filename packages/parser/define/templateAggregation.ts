import { AstCursor } from "../astCursor";
import { Context, PatternNode } from "../types";
import TemplateArgument from "./templateArgument";
import TemplateParameter from "./templateParameter";

export default class TemplateAggregation extends TemplateParameter {
  static readonly CODE_STRING_PREFIX = "__template_agg_";

  constructor(
    private readonly name: string,
    private readonly allowedPatterns: AggregationPart[],
    private readonly cardinality: AggregationCardinality,
    private readonly context?: Context,
    private readonly separatorToken?: string
  ) {
    super();
  }

  toCodeString(): string {
    if (this._id === undefined) {
      this._id = TemplateParameter.issueId();
    }
    return TemplateAggregation.CODE_STRING_PREFIX + this._id.toString();
  }

  toPatternNode(cursor: AstCursor): PatternNode {
    throw new Error("Method not implemented.");
  }
}

export interface AggregationPart {
  template: TemplateStringsArray;
  params: (string | TemplateArgument)[];
}

export enum AggregationCardinality {
  ZeroToOne = "0..1",
  ZeroToMany = "0..n",
  OneToMany = "1..n",
}
