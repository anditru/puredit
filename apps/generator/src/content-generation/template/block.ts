import { Path, Variable } from "../context-var-detection/blockVariableMap";
import TemplateParameter from "./parameter";

export default class TemplateBlock extends TemplateParameter {
  static lastId = -1;
  static issueId() {
    TemplateBlock.lastId++;
    return TemplateBlock.lastId;
  }

  constructor(path: Path, private readonly contextVariables: Variable[]) {
    super(TemplateBlock.issueId(), path);
  }

  copyWithPath(newPath: Path): TemplateBlock {
    return new TemplateBlock(newPath, this.contextVariables);
  }

  toDeclarationString(): string {
    const variableName = this.toVariableName();
    const contextVariableString = this.serializeContextVariables();
    return `const ${variableName} = block(${contextVariableString});\n`;
  }

  private serializeContextVariables() {
    if (this.contextVariables && this.contextVariables.length) {
      const assignments = this.contextVariables
        .map((variable) => `"${variable.name}": undefined`)
        .join(", ");
      return `{ ${assignments} }`;
    } else {
      return "{}";
    }
  }

  toVariableName(): string {
    return `block${this.id}`;
  }
}
