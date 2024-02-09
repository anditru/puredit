import PatternNode from "./patternNode";
import AstNode from "../../ast/node";
import TemplateChain from "../../define/templateChain";
import { Target } from "../../treeSitterParser";

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

  matches(astNode: AstNode): boolean {
    return this.astNodeType === astNode.type;
  }
}
