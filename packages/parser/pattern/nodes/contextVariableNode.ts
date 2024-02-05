import AstNode from "../../ast/node";
import TemplateContextVariable from "../../define/templateContextVariable";
import { Context } from "../../match/types";
import { Target } from "../../treeSitterParser";
import PatternNode from "./patternNode";

export default class ContextVariableNode extends PatternNode {
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

  matches(astNode: AstNode, context: Context): boolean {
    return (
      astNode.cleanNodeType === "identifier" &&
      astNode.text === context[this.templateContextVariable.name]
    );
  }
}
