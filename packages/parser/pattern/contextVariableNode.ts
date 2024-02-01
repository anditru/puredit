import AstNode from "../ast/node";
import TemplateContextVariable from "../define/templateContextVariable";
import { Context } from "../match/types";
import PatternNode from "./patternNode";

export default class ContextVariableNode extends PatternNode {
  static readonly TYPE = "ContextVariable";

  constructor(
    public readonly text: string,
    fieldName: string | null,
    public readonly templateContextVariable: TemplateContextVariable
  ) {
    super(ContextVariableNode.TYPE, text, fieldName);
  }

  matches(astNode: AstNode, context: Context): boolean {
    return (
      astNode.cleanNodeType === "identifier" &&
      astNode.text === context[this.templateContextVariable.name]
    );
  }
}
