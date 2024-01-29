import AstCursor from "../ast/cursor";
import PatternNode from "../pattern/patternNode";

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

  abstract toCodeString(): string;
  abstract toPatternNode(cursor: AstCursor): PatternNode;
}
