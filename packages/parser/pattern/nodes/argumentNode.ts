import TemplateArgument from "../../define/templateArgument";
import PatternNode from "./patternNode";
import AstNode from "../../ast/node";
import { Target } from "../../treeSitterParser";

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

  matches(astNode: AstNode): boolean {
    return this.templateArgument.types.includes(astNode.cleanNodeType);
  }

  get name() {
    return this.templateArgument.name;
  }
}
