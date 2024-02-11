import PatternNode from "./patternNode";
import TemplateChain from "../../define/templateChain";
import { Target } from "../../treeSitterParser";
import AstCursor from "../../ast/cursor";

export default class ChainNode extends PatternNode {
  static readonly TYPE = "ChainNode";
  static readonly CHAIN_NODE_TYPES = {
    py: "call",
    ts: "call_expression",
  };

  public astNodeType: string;

  constructor(
    language: Target,
    text: string,
    fieldName: string | undefined,
    public readonly templateChain: TemplateChain
  ) {
    super(language, ChainNode.TYPE, text, fieldName);
    this.astNodeType = ChainNode.CHAIN_NODE_TYPES[language];
  }

  getMatchedTypes(): string[] {
    return [this.astNodeType];
  }

  matches(astCursor: AstCursor): boolean {
    const astNode = astCursor.currentNode;
    return this.astNodeType === astNode.type && this.fieldName === astCursor.currentFieldName;
  }
}
