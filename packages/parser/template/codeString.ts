import { Language } from "@puredit/language-config";
import ParameterTable from "./parameterTable";
import TemplateParameter from "./parameters/templateParameter";
import { TransformableTemplate } from "./template";

/**
 * @class
 * Represents a code string with an additional parameter table that contains
 * all parameters in the code string. This allows to check if a certain part
 * of the code is covered by a parameter. This is required during the transformation
 * of a template into a pattern.
 */
export default class CodeString {
  static fromTemplate(template: TransformableTemplate, language: Language) {
    const templateStrings = template.templateStrings;
    const params = template.params;
    const substitutions = params.map((param: TemplateParameter) => param.toCodeString(language));
    const raw = String.raw(templateStrings, ...substitutions);
    const parameterTable = ParameterTable.fromTemplate(templateStrings, params, language);
    return new CodeString(raw, parameterTable);
  }

  private _raw: string;

  constructor(raw: string, private readonly parameterTable: ParameterTable = new ParameterTable()) {
    this._raw = raw;
  }

  replace(placeholder: string, replacement: CodeString): CodeString {
    const parts = this._raw.split(placeholder);
    if (parts.length === 1) {
      throw new Error(`Placeholder ${placeholder} not found`);
    } else if (parts.length > 2) {
      throw new Error(`Placeholder ${placeholder} found multiple times`);
    }
    const startOffset = parts[0].length;
    const replacementParameterTable = replacement.parameterTable;
    replacementParameterTable.shift(startOffset);

    const shiftBound = startOffset + placeholder.length;
    const shiftOffset = replacement.raw.length - placeholder.length;
    this.parameterTable.shiftStartingAfter(shiftBound, shiftOffset);

    this.parameterTable.merge(replacementParameterTable);
    this._raw = parts[0] + replacement.raw + parts[1];
    return this;
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

  /**
   * Get the template parameter that covers the code between from and to.
   * @param from Start position
   * @param to End position
   * @returns A template parameter if from and to a the boundries of a template parameter, otherwise null.
   */
  resolveParameter(from: number, to: number): TemplateParameter | undefined {
    return this.parameterTable.get(from, to);
  }

  get raw() {
    return this._raw;
  }
}
