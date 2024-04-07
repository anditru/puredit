import { Path } from "../context-var-detection/blockVariableMap";

export default abstract class TemplateParameter {
  constructor(protected readonly id: number, public readonly path: Path) {}

  toTemplatePart(): string {
    return "${" + this.toVariableName() + "}";
  }

  abstract toDeclarationString(): string;
  abstract toVariableName(): string;
}
