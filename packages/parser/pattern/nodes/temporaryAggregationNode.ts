import PatternNode from "./patternNode";
import TemplateAggregation from "../../template/parameters/templateAggregation";
import AstCursor from "../../ast/cursor";
import { Language } from "@puredit/language-config";
import AggregationNode from "./aggregationNode";

export default class TemporaryAggregationNode extends PatternNode {
  static readonly TYPE = "TemporaryAggregationNode";

  constructor(
    private readonly language: Language,
    text: string,
    fieldName: string | undefined,
    public readonly templateAggregation: TemplateAggregation
  ) {
    super(TemporaryAggregationNode.TYPE, text, fieldName);
  }

  toAggregationNode(fieldName: string) {
    return new AggregationNode(
      this.language,
      this.text,
      fieldName,
      this.templateAggregation.type,
      this.templateAggregation
    );
  }

  getMatchedTypes(): string[] {
    return [];
  }

  matches(astCursor: AstCursor): boolean {
    throw new Error("TempararyAggregationNode encountered in matching.");
  }
}
