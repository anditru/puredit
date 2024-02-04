import AstCursor from "../ast/cursor";
import ContextVariableNode from "../pattern/nodes/contextVariableNode";
import PatternNode from "../pattern/nodes/patternNode";
import { Target } from "../treeSitterParser";
import TemplateParameter from "./templateParameter";

export default class TemplateContextVariable extends TemplateParameter {
  static readonly CODE_STRING_PREFIX = "__template_context_variable_";

  constructor(public readonly name: string) {
    super();
  }

  toCodeString(): string {
    if (this._id === undefined) {
      this._id = TemplateParameter.issueId();
    }
    return TemplateContextVariable.CODE_STRING_PREFIX + this._id.toString();
  }

  toPatternNode(cursor: AstCursor, language: Target): PatternNode {
    return new ContextVariableNode(
      language,
      cursor.currentNode.text,
      cursor.currentFieldName,
      this
    );
  }
}
