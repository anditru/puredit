import { Language } from "@puredit/language-config";
import AstCursor from "../../ast/cursor";
import PatternNode from "../../pattern/nodes/patternNode";

/**
 * @class
 * Abtract base class all template parameters must inherit from.
 */
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

  /**
   * Transforms the template paramter into a code string. This is required to
   * transform a template into a code string that can be parsed by the Tree-sitter
   * parser and then transfomed into a pattern.
   * @param language
   */
  abstract toCodeString(language: Language): string;

  /**
   * Transforms the template paramter into the corresponding pattern node.
   * @param cursor
   * @param language
   */
  abstract toPatternNode(cursor: AstCursor, language: Language): PatternNode;
}
