import { Path } from "../context-var-detection/blockVariableMap";
import TemplateParameter from "./parameter";
import { Range } from "../common";

export default class TemplateChain extends TemplateParameter {
  static lastId = -1;
  static issueId() {
    TemplateChain.lastId++;
    return TemplateChain.lastId;
  }

  constructor(path: Path, public readonly startRange: Range, public readonly linkRanges: Range[]) {
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
