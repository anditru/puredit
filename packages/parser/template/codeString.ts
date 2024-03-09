import { isString } from "@puredit/utils";
import ParameterTable from "./parameterTable";
import TemplateParameter from "./parameters/templateParameter";

export default class CodeString {
  static fromTemplate(
    templateStrings: TemplateStringsArray,
    params: (string | TemplateParameter)[]
  ) {
    const substitutions = params.map((param) => {
      if (isString(param)) {
        return param;
      } else {
        return param.toCodeString();
      }
    });
    const raw = String.raw(templateStrings, ...substitutions);
    const parameterTable = ParameterTable.fromTemplate(templateStrings, params);
    return new CodeString(raw, parameterTable);
  }

  private _raw: string;

  constructor(raw: string, private readonly parameterTable: ParameterTable = new ParameterTable()) {
    this._raw = raw;
  }

  insertInto(target: string, placeholder: string): CodeString {
    const parts = target.split(placeholder);
    if (parts.length === 1) {
      throw new Error(`Placeholder ${placeholder} not found in string ${target}`);
    } else if (parts.length > 2) {
      throw new Error(`Placeholder ${placeholder} found multiple times in string ${target}`);
    }
    const startOffset = parts[0].length;
    this.parameterTable.shift(startOffset);
    this._raw = parts[0] + this._raw + parts[1];
    return this;
  }

  resolveParameter(from: number, to: number): TemplateParameter | undefined {
    return this.parameterTable.get(from, to);
  }

  get raw() {
    return this._raw;
  }
}