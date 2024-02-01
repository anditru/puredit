import TemplateArgument from "../define/templateArgument";
import PatternNode from "./patternNode";
import AstNode from "../ast/node";

export default class ArgumentNode extends PatternNode {
  static readonly TYPE: string = "ArgumentNode";

  constructor(
    public readonly text: string,
    fieldName: string | null,
    public readonly templateArgument: TemplateArgument
  ) {
    super(ArgumentNode.TYPE, text, fieldName);
  }

  matches(astNode: AstNode): boolean {
    return this.templateArgument.types.includes(astNode.cleanNodeType);
  }

  get name() {
    return this.templateArgument.name;
  }
}
