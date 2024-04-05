import { Path } from "../context-var-detection/blockVariableMap";
import TemplateParameter from "./parameter";

export default class TemplateChain extends TemplateParameter {
  static lastId = -1;
  static issueId() {
    TemplateChain.lastId++;
    return TemplateChain.lastId;
  }

  constructor(path: Path) {
    super(TemplateChain.issueId(), path);
  }

  toDeclarationString(): string {
    const variableName = this.toVariableName();
    return `const ${variableName} = chain("${variableName}", []);\n`;
  }

  toVariableName(): string {
    return `chain${this.id}`;
  }
}
