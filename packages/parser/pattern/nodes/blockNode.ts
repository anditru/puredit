import PatternNode from "./patternNode";
import TemplateBlock from "../../template/parameters/templateBlock";
import AstCursor from "../../ast/cursor";
import { Language } from "@puredit/language-config";
import { loadBlocksConfigFor } from "@puredit/language-config";

export default class BlockNode extends PatternNode {
  static readonly TYPE = "BlockNode";

  public readonly astNodeType: string;

  constructor(
    language: Language,
    text: string,
    fieldName: string | undefined,
    public readonly templateBlock: TemplateBlock
  ) {
    super(BlockNode.TYPE, text, fieldName);
    const blocksConfig = loadBlocksConfigFor(language);
    this.astNodeType = blocksConfig.blockNodeType;
  }

  getMatchedTypes(): string[] {
    return [this.astNodeType];
  }

  matches(astCursor: AstCursor): boolean {
    const astNode = astCursor.currentNode;
    return (
      this.astNodeType === astNode.cleanNodeType && astCursor.currentFieldName === this.fieldName
    );
  }
}
