import AstCursor from "../../ast/cursor";
import TemplateContextVariable from "../../define/templateContextVariable";
import { Context } from "../../match/types";
import { Target } from "../../treeSitterParser";
import RegularNode from "./regularNode";

export default class ContextVariableNode extends RegularNode {
  constructor(
    language: Target,
    type: string,
    text: string,
    fieldName: string | null,
    public readonly templateContextVariable: TemplateContextVariable
  ) {
    super(language, type, text, fieldName);
  }

  getMatchedTypes(): string[] {
    return ["*"];
  }

  matches(astCursor: AstCursor, context?: Context): boolean {
    if (astCursor.currentFieldName !== this.fieldName) {
      return false;
    }
    const astNode = astCursor.currentNode;
    if (context && this.requiredContextExists(context)) {
      return (
        astNode.cleanNodeType === "identifier" &&
        astNode.text === context[this.templateContextVariable.name]
      );
    } else {
      return super.matches(astCursor);
    }
  }

  private requiredContextExists(context: Context): boolean {
    return Object.prototype.hasOwnProperty.call(context, this.templateContextVariable.name);
  }
}
