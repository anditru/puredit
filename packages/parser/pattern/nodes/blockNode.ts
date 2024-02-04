import PatternNode from "./patternNode";
import AstNode from "../../ast/node";
import TemplateBlock from "../../define/templateBlock";
import { Target } from "../../treeSitterParser";

export default class BlockNode extends PatternNode {
  static readonly TYPE = "BlockNode";

  constructor(
    language: Target,
    text: string,
    fieldName: string | null,
    public readonly templateBlock: TemplateBlock
  ) {
    super(language, BlockNode.TYPE, text, fieldName);
  }

  matches(astNode: AstNode): boolean {
    switch (this.language) {
      case Target.TypeScript:
        return astNode.cleanNodeType === "statement_block";
      case Target.Python:
        return astNode.cleanNodeType === "block";
      default:
        throw new Error("Unsupported language");
    }
  }
}
