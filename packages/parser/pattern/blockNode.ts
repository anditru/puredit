import PatternNode from "./patternNode";
import AstNode from "../ast/node";
import TemplateBlock from "../define/templateBlock";

export default class BlockNode extends PatternNode {
  static readonly TYPE = "BlockNode";

  constructor(
    public readonly text: string,
    fieldName: string | null,
    public readonly templateBlock: TemplateBlock
  ) {
    super(BlockNode.TYPE, text, fieldName);
  }

  matches(astNode: AstNode): boolean {
    switch (this.templateBlock.blockType) {
      case "ts":
        return astNode.cleanNodeType === "statement_block";
      case "py":
        return astNode.cleanNodeType === "block";
      default:
        throw new Error("Unsupported language");
    }
  }
}
