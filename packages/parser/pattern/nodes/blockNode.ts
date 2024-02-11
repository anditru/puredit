import PatternNode from "./patternNode";
import TemplateBlock from "../../define/templateBlock";
import { Target } from "../../treeSitterParser";
import AstCursor from "../../ast/cursor";

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

  getMatchedTypes(): string[] {
    switch (this.language) {
      case Target.TypeScript:
        return ["statement_block"];
      case Target.Python:
        return ["block"];
    }
  }

  matches(astCursor: AstCursor): boolean {
    if (astCursor.currentFieldName !== this.fieldName) {
      return false;
    }
    const astNode = astCursor.currentNode;
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
