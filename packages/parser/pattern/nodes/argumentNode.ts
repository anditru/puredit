import TemplateArgument from "../../template/parameters/templateArgument";
import PatternNode from "./patternNode";
import AstCursor from "../../ast/cursor";

export default class ArgumentNode extends PatternNode {
  static readonly TYPE: string = "ArgumentNode";

  constructor(
    text: string,
    fieldName: string | undefined,
    public readonly templateArgument: TemplateArgument
  ) {
    super(ArgumentNode.TYPE, text, fieldName);
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
