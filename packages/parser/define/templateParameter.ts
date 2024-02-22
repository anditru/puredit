import AstCursor from "../ast/cursor";
import { Language } from "@puredit/language-config";
import PatternNode from "../pattern/nodes/patternNode";

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
  abstract toPatternNode(cursor: AstCursor, language: Language): PatternNode;
  abstract toDraftString(language: Language): string;
}
