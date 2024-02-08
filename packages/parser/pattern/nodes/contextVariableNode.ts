import AstNode from "../../ast/node";
import TemplateContextVariable from "../../define/templateContextVariable";
import { Context } from "../../match/types";
import { Target } from "../../treeSitterParser";
import RegularNode from "./regularNode";

export default class ContextVariableNode extends RegularNode {
  static readonly TYPE = "ContextVariable";

  constructor(
    language: Target,
    text: string,
    fieldName: string | null,
    public readonly templateContextVariable: TemplateContextVariable
  ) {
    super(language, ContextVariableNode.TYPE, text, fieldName);
  }

  getMatchedTypes(): string[] {
    return ["*"];
  }

  matches(astNode: AstNode, context?: Context): boolean {
    if (context && this.requiredContextExists(context)) {
      return (
        astNode.cleanNodeType === "identifier" &&
        astNode.text === context[this.templateContextVariable.name]
      );
    } else {
      return super.matches(astNode);
    }
  }

  private requiredContextExists(context: Context): boolean {
    return Object.prototype.hasOwnProperty.call(context, this.templateContextVariable.name);
  }
}
