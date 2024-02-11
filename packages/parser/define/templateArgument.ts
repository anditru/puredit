import AstCursor from "../ast/cursor";
import { Language } from "../config/types";
import ArgumentNode from "../pattern/nodes/argumentNode";
import TemplateParameter from "./templateParameter";

export default class TemplateArgument extends TemplateParameter {
  static readonly CODE_STRING_PREFIX = "__template_arg_";

  constructor(public readonly name: string, public readonly types: string[]) {
    super();
  }

  toCodeString(): string {
    if (this._id === undefined) {
      this._id = TemplateParameter.issueId();
    }
    return TemplateArgument.CODE_STRING_PREFIX + this._id.toString();
  }

  toPatternNode(cursor: AstCursor, language: Language) {
    return new ArgumentNode(language, cursor.currentNode.text, cursor.currentFieldName, this);
  }
}
