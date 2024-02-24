import AstCursor from "../../ast/cursor";
import { Language } from "@puredit/language-config";
import TemplateContextVariable from "../../define/templateContextVariable";
import { Context } from "../../match/types";
import RegularNode from "./regularNode";

export default class ContextVariableNode extends RegularNode {
  constructor(
    type: string,
    text: string,
    fieldName: string | undefined,
    public readonly templateContextVariable: TemplateContextVariable
  ) {
    super(type, text, fieldName);
  }

  getMatchedTypes(): string[] {
    return ["identifier"];
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
