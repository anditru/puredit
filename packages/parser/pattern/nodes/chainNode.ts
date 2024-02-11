import PatternNode from "./patternNode";
import TemplateChain from "../../define/templateChain";
import AstCursor from "../../ast/cursor";
import { Language } from "../../config/types";
import { loadChainsConfigFor } from "../../config/load";

export default class ChainNode extends PatternNode {
  static readonly TYPE = "ChainNode";

  public astNodeType: string;

  constructor(
    language: Language,
    text: string,
    fieldName: string | undefined,
    public readonly templateChain: TemplateChain
  ) {
    super(language, ChainNode.TYPE, text, fieldName);
    const chainsConfig = loadChainsConfigFor(language);
    this.astNodeType = chainsConfig.chainNodeType;
  }

  getMatchedTypes(): string[] {
    return [this.astNodeType];
  }

  matches(astCursor: AstCursor): boolean {
    const astNode = astCursor.currentNode;
    return this.astNodeType === astNode.type && this.fieldName === astCursor.currentFieldName;
  }
}
