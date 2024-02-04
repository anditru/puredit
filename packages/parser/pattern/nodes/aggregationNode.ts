import PatternNode from "./patternNode";
import AstNode from "../../ast/node";
import TemplateAggregation from "../../define/templateAggregation";
import { Target } from "../../treeSitterParser";

export default class AggregationNode extends PatternNode {
  static readonly TYPE = "AggregationNode";
  static readonly AGGREGATABLE_NODE_TYPES = {
    py: [{ name: "argument_list", startToken: "(", delimiterToken: ",", endToken: ")" }],
    ts: [{ name: "arguments", startToken: "(", delimiterToken: ",", endToken: ")" }],
  };

  public readonly startToken: string;
  public readonly delimiterToken: string;
  public readonly endToken: string;

  constructor(
    language: Target,
    text: string,
    fieldName: string | null,
    public astNodeType: string,
    public readonly templateAggregation: TemplateAggregation
  ) {
    super(language, AggregationNode.TYPE, text, fieldName);

    const aggregatableNodeTypes = AggregationNode.AGGREGATABLE_NODE_TYPES[language];
    const nodeTypeConfig = aggregatableNodeTypes.find(
      (nodeTypeConfig) => (nodeTypeConfig.name = astNodeType)
    );
    if (!nodeTypeConfig) {
      throw new Error(
        `AST node type ${astNodeType} of language ${language} is not supported for aggregation`
      );
    }

    this.startToken = nodeTypeConfig.startToken;
    this.delimiterToken = nodeTypeConfig.delimiterToken;
    this.endToken = nodeTypeConfig.endToken;
  }

  matches(astNode: AstNode): boolean {
    return this.astNodeType === astNode.type;
  }
}
