import { ContextVariableMap } from "@puredit/projections";
import AstCursor from "../../ast/cursor";
import RegularNode from "./regularNode";
import { Language } from "@puredit/language-config";

export default class ContextVariableNode extends RegularNode {
  public readonly name: string;

  constructor(
    name: string,
    language: Language,
    type: string,
    fieldName: string | undefined,
    text: string,
    startIndex: number,
    endIndex: number
  ) {
    super(language, type, fieldName, text, startIndex, endIndex);
    this.name = name;
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
      return astNode.cleanNodeType === "identifier" && astNode.text === this.name;
    } else {
      return super.matches(astCursor);
    }
  }

  private requiredContextExists(contextVariables: ContextVariableMap): boolean {
    return Object.prototype.hasOwnProperty.call(contextVariables, this.name);
  }

  toDraftString(): string {
    return this.name;
  }
}
