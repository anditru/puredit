import TemplateArgument from "../../define/templateArgument";
import PatternNode from "./patternNode";
import { Target } from "../../treeSitterParser";
import AstCursor from "../../ast/cursor";

export default class ArgumentNode extends PatternNode {
  static readonly TYPE: string = "ArgumentNode";

  constructor(
    language: Target,
    text: string,
    fieldName: string | null,
    public readonly templateArgument: TemplateArgument
  ) {
    super(language, ArgumentNode.TYPE, text, fieldName);
  }

  getMatchedTypes(): string[] {
    return this.templateArgument.types;
  }

  matches(astCursor: AstCursor): boolean {
    const astNode = astCursor.currentNode;
    return (
      this.templateArgument.types.includes(astNode.cleanNodeType) &&
      astCursor.currentFieldName === this.fieldName
    );
  }

  get name() {
    return this.templateArgument.name;
  }
}
