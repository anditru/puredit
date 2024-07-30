import { Path } from "../context-var-detection/blockVariableMap";
import TemplateParameter from "./parameter";

export default class TemplateContextVariable extends TemplateParameter {
  static lastId = -1;
  static issueId() {
    TemplateContextVariable.lastId++;
    return TemplateContextVariable.lastId;
  }

  constructor(path: Path, private readonly name: string) {
    super(TemplateContextVariable.issueId(), path);
  }
  copyWithPath(newPath: Path): TemplateContextVariable {
    return new TemplateContextVariable(newPath, this.name);
  }

  toDeclarationString(): string {
    return `const ${this.name} = contextVariable("${this.name}");\n`;
  }

  toVariableName(): string {
    return this.name;
  }
}
