import PatternNode from "./patternNode";
import AstNode from "../../ast/node";
import TemplateAggregation from "../../define/templateAggregation";
import { Target } from "../../treeSitterParser";

export default class AggregationNode extends PatternNode {
  static readonly TYPE = "AggregationNode";
  static readonly MATCHING_NODE_TYPES = {
    py: ["argument_list"],
    ts: ["arguments"],
  };

  constructor(
    language: Target,
    text: string,
    fieldName: string | null,
    public readonly templateAggregation: TemplateAggregation
  ) {
    super(language, AggregationNode.TYPE, text, fieldName);
  }

  matches(astNode: AstNode): boolean {
    const matchingNodeTypes = AggregationNode.MATCHING_NODE_TYPES[this.language];
    return matchingNodeTypes.includes(astNode.cleanNodeType);
  }
}
