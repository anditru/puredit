import PatternNode from "./patternNode";
import TemplateAggregation from "../../define/templateAggregation";
import AstCursor from "../../ast/cursor";
import { Language } from "@puredit/language-config";
import AggregationNode from "./aggregationNode";

export default class TemporaryAggregationNode extends PatternNode {
  static readonly TYPE = "TemporaryAggregationNode";

  constructor(
    language: Language,
    text: string,
    fieldName: string | undefined,
    public readonly astNodeType: string,
    public readonly templateAggregation: TemplateAggregation
  ) {
    super(language, TemporaryAggregationNode.TYPE, text, fieldName);
  }

  toAggregationNode(astNodeType: string, fieldName: string) {
    return new AggregationNode(
      this.language,
      this.text,
      fieldName,
      astNodeType,
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
