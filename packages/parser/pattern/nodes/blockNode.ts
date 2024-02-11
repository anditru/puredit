import PatternNode from "./patternNode";
import TemplateBlock from "../../define/templateBlock";
import { Target } from "../../treeSitterParser";
import AstCursor from "../../ast/cursor";

export default class BlockNode extends PatternNode {
  static readonly TYPE = "BlockNode";
  static readonly BLOCK_NODE_TYPES = {
    py: "block",
    ts: "statement_block",
  };

  constructor(
    language: Target,
    text: string,
    fieldName: string | undefined,
    public readonly templateBlock: TemplateBlock
  ) {
    super(language, BlockNode.TYPE, text, fieldName);
  }

  getMatchedTypes(): string[] {
    return [BlockNode.BLOCK_NODE_TYPES[this.language]];
  }

  matches(astCursor: AstCursor): boolean {
    const astNode = astCursor.currentNode;
    return (
      BlockNode.BLOCK_NODE_TYPES[this.language] === astNode.cleanNodeType &&
      astCursor.currentFieldName === this.fieldName
    );
  }
}
