import AstCursor from "../../ast/cursor";
import { Language } from "@puredit/language-config";
import ContextVariableNode from "../../pattern/nodes/contextVariableNode";
import PatternNode from "../../pattern/nodes/patternNode";
import TemplateParameter from "./templateParameter";

export default class TemplateContextVariable extends TemplateParameter {
  static readonly CODE_STRING_PREFIX = "__template_context_variable_";

  constructor(public readonly name: string) {
    super();
  }

  toCodeString(): string {
    return TemplateContextVariable.CODE_STRING_PREFIX + this.id.toString();
  }

  toPatternNode(cursor: AstCursor, language: Language): PatternNode {
    return new ContextVariableNode(
      cursor.currentNode.type,
      cursor.currentNode.text,
      cursor.currentFieldName,
      this
    );
  }

  toDraftString(language: Language): string {
    return this.name;
  }
}
