import { AstCursor } from "../astCursor";
import { PatternNode } from "../types";
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

  toPatternNode(cursor: AstCursor): PatternNode {
    const patternNode = this.getInitialPatternNode(cursor);
    patternNode.text = cursor.nodeText;
    patternNode.contextVariable = this;
    patternNode.type = "TemplateContextVariable";
    return patternNode;
  }
}
