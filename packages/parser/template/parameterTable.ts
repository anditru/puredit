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
    const hash = this.getKey(from, to);
    this.table[hash] = templateParameter;
  }

  get(from: number, to: number): TemplateParameter | undefined {
    const hash = this.getKey(from, to);
    return this.table[hash];
  }

  delete(from: number, to: number) {
    const key = this.getKey(from, to);
    delete this.table[key];
  }

  shift(offset: number) {
    Object.keys(this.table).forEach((key: string) => {
      const { from, to } = this.decodeKey(key);
      this.shiftParameter(from, to, offset);
    });
  }

  shiftStartingAfter(bound: number, offset: number) {
    Object.keys(this.table).forEach((key: string) => {
      const { from, to } = this.decodeKey(key);
      if (from > bound) {
        this.shiftParameter(from, to, offset);
      }
    });
  }

  merge(other: ParameterTable) {
    Object.keys(other.table).forEach((key: string) => {
      const { from, to } = JSON.parse(key);
      const existingParameter = this.get(from, to);
      if (existingParameter) {
        throw new Error(`Cannot insert item with duplicate key from ${from} to ${to}`);
      }
      this.set(from, to, other.get(from, to)!);
    });
  }

  private shiftParameter(from: number, to: number, offset: number) {
    const newFrom = from + offset;
    const newTo = to + offset;
    const parameter = this.get(from, to);
    if (!parameter) {
      throw new Error(`No item with key from ${from} to ${to} found`);
    }
    this.set(newFrom, newTo, parameter);
    this.delete(from, to);
  }

  private getKey(from: number, to: number): string {
    return JSON.stringify({ from, to });
  }

  private decodeKey(key: string) {
    return JSON.parse(key);
  }
}
