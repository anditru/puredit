import { isString } from "@puredit/utils-shared";
import TemplateParameter from "./parameters/templateParameter";
import TemplateAggregation from "./parameters/templateAggregation";
import TemplateChain from "./parameters/templateChain";
import { Language } from "@puredit/language-config";
import CodeString from "./codeString";
import Pattern from "../pattern/pattern";

export default class Template {
  private patterns: Pattern[] = [];

  constructor(
    public readonly name: string,
    public readonly language: Language,
    public readonly templateStrings: TemplateStringsArray,
    public readonly params: (string | TemplateParameter)[]
  ) {}

  hasAggregations(): boolean {
    return !!this.params.find((param) => param instanceof TemplateAggregation);
  }

  getAggregations(): TemplateAggregation[] {
    return this.params.filter(
      (param) => param instanceof TemplateAggregation
    ) as TemplateAggregation[];
  }

  hasChains(): boolean {
    return !!this.params.find((param) => param instanceof TemplateChain);
  }

  getChains(): TemplateChain[] {
    return this.params.filter((param) => param instanceof TemplateChain) as TemplateChain[];
  }

  toCodeString(): CodeString {
    return CodeString.fromTemplate(this.templateStrings!, this.params);
  }

  getAggregation(name: string): TemplateAggregation | undefined {
    return this.params.find(
      (param) => param instanceof TemplateAggregation && param.name === name
    ) as TemplateAggregation;
  }

  getChain(name: string): TemplateChain | undefined {
    return this.params.find(
      (param) => param instanceof TemplateChain && param.name === name
    ) as TemplateChain;
  }

  toDraftString(): string {
    const substitutions = this.params.map((param) => {
      if (isString(param)) {
        return param;
      } else {
        return param.toDraftString();
      }
    });
    return String.raw(this.templateStrings, ...substitutions);
  }

  addPattern(pattern: Pattern) {
    this.patterns.push(pattern);
  }

  getPatterns(): Pattern[] {
    return this.patterns;
  }
}
