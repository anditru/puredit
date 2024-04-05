import { Path } from "../context-var-detection/blockVariableMap";
import TemplateParameter from "./parameter";

export default class TemplateArgument extends TemplateParameter {
  static lastId = -1;
  static issueId() {
    TemplateArgument.lastId++;
    return TemplateArgument.lastId;
  }

  constructor(path: Path, public readonly types: string[]) {
    super(TemplateArgument.issueId(), path);
  }

  toDeclarationString(): string {
    const variableName = this.toVariableName();
    return `const ${variableName} = arg("${variableName}", ${JSON.stringify(this.types)});\n`;
  }

  toVariableName(): string {
    return `arg${this.id}`;
  }
}
