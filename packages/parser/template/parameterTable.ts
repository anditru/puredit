import { isString } from "@puredit/utils";
import TemplateParameter from "./parameters/templateParameter";

export default class ParameterTable {
  private table: Record<string, TemplateParameter> = {};

  static fromTemplate(
    templateStrings: TemplateStringsArray,
    params: (string | TemplateParameter)[]
  ): ParameterTable {
    let result = "";
    const table = new ParameterTable();

    for (let i = 0; i < templateStrings.length; i++) {
      result += templateStrings[i];
      const param = params[i];

      if (param && param instanceof TemplateParameter) {
        const substitution = (params[i] as TemplateParameter).toCodeString();
        const substitutionIndex = result.length;
        const substitutionLength = substitution.length;
        table.set(substitutionIndex, substitutionIndex + substitutionLength, param);
        result += substitution;
      } else if (param && isString(param)) {
        result += param;
      }
    }

    return table;
  }

  set(from: number, to: number, templateParameter: TemplateParameter) {
    const hash = this.getHash(from, to);
    this.table[hash] = templateParameter;
  }

  get(from: number, to: number): TemplateParameter | undefined {
    const hash = this.getHash(from, to);
    return this.table[hash];
  }

  shift(offset: number) {
    Object.keys(this.table).forEach((key: string) => {
      const value = this.table[key];
      let { from, to } = JSON.parse(key);
      from += offset;
      to += offset;
      const newHash = this.getHash(from, to);
      delete this.table[key];
      this.table[newHash] = value;
    });
  }

  private getHash(from: number, to: number): string {
    return JSON.stringify({ from, to });
  }
}
