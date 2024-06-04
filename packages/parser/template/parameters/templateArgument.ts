import AstCursor from "../../ast/cursor";
import { Language } from "@puredit/language-config";
import ArgumentNode from "../../pattern/nodes/argumentNode";
import TemplateParameter from "./templateParameter";

export default class TemplateArgument extends TemplateParameter {
  static readonly CODE_STRING_PREFIX = "__template_arg_";

  constructor(public readonly name: string, public readonly types: string[]) {
    super();
  }

  toCodeString(): string {
    return TemplateArgument.CODE_STRING_PREFIX + this.id.toString();
  }

  toPatternNode(cursor: AstCursor, language: Language) {
    return new ArgumentNode(
      this.name,
      language,
      this.types,
      cursor.currentFieldName,
      cursor.currentNode.text
    );
  }
}
