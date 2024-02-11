import PatternNode from "./patternNode";
import TemplateChain from "../../define/templateChain";
import { Target } from "../../treeSitterParser";
import AstCursor from "../../ast/cursor";

export default class ChainNode extends PatternNode {
  static readonly TYPE = "ChainNode";

  constructor(
    language: Target,
    text: string,
    fieldName: string | null,
    public astNodeType: string,
    public readonly templateChain: TemplateChain
  ) {
    super(language, ChainNode.TYPE, text, fieldName);
  }

  getMatchedTypes(): string[] {
    return [this.astNodeType];
  }

  matches(astCursor: AstCursor): boolean {
    const astNode = astCursor.currentNode;
    return this.astNodeType === astNode.type && this.fieldName === astCursor.currentFieldName;
  }
}
