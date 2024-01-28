import AstCursor from "../ast/cursor";
import { PatternNode } from "../types";

export default abstract class TemplateParameter {
  private static highestId = -1;
  public static issueId(): number {
    this.highestId++;
    return this.highestId;
  }

  protected _id: number | undefined;
  get id() {
    return this._id;
  }

  protected getInitialPatternNode(cursor: AstCursor): PatternNode {
    return {
      type: cursor.currentNode.type,
      fieldName: cursor.currentFieldName || undefined,
    };
  }

  abstract toCodeString(): string;
  abstract toPatternNode(cursor: AstCursor): PatternNode;
}
