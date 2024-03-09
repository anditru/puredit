import AstCursor from "../../ast/cursor";
import PatternNode from "../../pattern/nodes/patternNode";
import Template from "../template";

export default abstract class TemplateParameter {
  private static highestId = -1;
  public static templateParameterRegistry: Map<number, TemplateParameter> = new Map();

  public static issueId(): number {
    this.highestId++;
    return this.highestId;
  }

  public readonly id: number;
  private _template: Template | undefined;

  constructor() {
    this.id = TemplateParameter.issueId();
    TemplateParameter.templateParameterRegistry.set(this.id, this);
  }

  protected checkAssignedToTemplate() {
    if (!this._template) {
      throw new Error("Parameter is not assigned to a template");
    }
  }

  set template(template: Template) {
    if (this._template && this._template !== template) {
      throw new Error("Parameter cannot be reassigned");
    }
    this._template = template;
  }

  get template(): Template | undefined {
    return this._template;
  }

  abstract toCodeString(): string;
  abstract toPatternNode(cursor: AstCursor): PatternNode;
  abstract toDraftString(): string;
  abstract copy(): TemplateParameter;
}
