import { Language } from "@puredit/language-config";
import AstCursor from "../../ast/cursor";
import ContextVariableNode from "../../pattern/nodes/contextVariableNode";
import PatternNode from "../../pattern/nodes/patternNode";
import TemplateParameter from "./templateParameter";
import Pattern from "../../pattern/pattern";

export default class TemplateContextVariable extends TemplateParameter {
  static readonly CODE_STRING_PREFIX = "__template_context_variable_";

  constructor(public readonly name: string) {
    super();
  }

  toCodeString(language: Language): string {
    return TemplateContextVariable.CODE_STRING_PREFIX + this.id.toString();
  }

  toPatternNode(cursor: AstCursor, language: Language): PatternNode {
    return new ContextVariableNode(
      this.name,
      language,
      cursor.currentNode.type,
      cursor.currentFieldName,
      cursor.currentNode.text
    );
  }
}
