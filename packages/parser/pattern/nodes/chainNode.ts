import PatternNode from "./patternNode";
import TemplateChain from "../../define/templateChain";
import AstCursor from "../../ast/cursor";
import { Language } from "@puredit/language-config";
import { loadChainableNodeTypesFor } from "@puredit/language-config";

export default class ChainNode extends PatternNode {
  static readonly TYPE = "ChainNode";

  private astNodeTypes: string[];

  constructor(
    language: Language,
    text: string,
    fieldName: string | undefined,
    public readonly templateChain: TemplateChain
  ) {
    super(language, ChainNode.TYPE, text, fieldName);
    this.astNodeTypes = loadChainableNodeTypesFor(language);
  }

  getMatchedTypes(): string[] {
    return this.astNodeTypes;
  }

  matches(astCursor: AstCursor): boolean {
    const astNode = astCursor.currentNode;
    return (
      this.astNodeTypes.includes(astNode.type) && this.fieldName === astCursor.currentFieldName
    );
  }
}
