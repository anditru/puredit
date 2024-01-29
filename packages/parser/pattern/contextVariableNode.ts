import AstNode from "../ast/node";
import TemplateContextVariable from "../define/templateContextVariable";
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

  matches(astNode: AstNode): boolean {
    return astNode.cleanNodeType === "identifier";
  }
}
