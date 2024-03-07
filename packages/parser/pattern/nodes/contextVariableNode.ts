import { ContextVariableMap } from "@puredit/projections";
import AstCursor from "../../ast/cursor";
import TemplateContextVariable from "../../template/parameters/templateContextVariable";
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

  matches(astCursor: AstCursor, contextVariables?: ContextVariableMap): boolean {
    if (astCursor.currentFieldName !== this.fieldName) {
      return false;
    }
    const astNode = astCursor.currentNode;
    if (contextVariables && this.requiredContextExists(contextVariables)) {
      return (
        astNode.cleanNodeType === "identifier" && astNode.text === this.templateContextVariable.name
      );
    } else {
      return super.matches(astCursor);
    }
  }

  private requiredContextExists(contextVariables: ContextVariableMap): boolean {
    return Object.prototype.hasOwnProperty.call(
      contextVariables,
      this.templateContextVariable.name
    );
  }
}
