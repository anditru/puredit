import { Language } from "@puredit/language-config";
import AstCursor from "../../ast/cursor";
import PatternNode from "../../pattern/nodes/patternNode";

export default abstract class TemplateParameter {
  private static highestId = -1;
  public static templateParameterRegistry: Map<number, TemplateParameter> = new Map();

  public static issueId(): number {
    this.highestId++;
    return this.highestId;
  }

  public readonly id: number;

  constructor() {
    this.id = TemplateParameter.issueId();
    TemplateParameter.templateParameterRegistry.set(this.id, this);
  }

  abstract toCodeString(language: Language): string;
  abstract toPatternNode(cursor: AstCursor, language: Language): PatternNode;
}
