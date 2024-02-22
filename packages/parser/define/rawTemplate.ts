import { isString } from "@puredit/utils";
import TemplateParameter from "./templateParameter";
import TemplateAggregation from "./templateAggregation";
import TemplateChain from "./templateChain";
import { Language } from "@puredit/language-config";

export default class RawTemplate {
  constructor(
    public readonly template: TemplateStringsArray,
    public readonly params: (string | TemplateParameter)[],
    public readonly name: string
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

  toCodeString(): string {
    const substitutions = this.params.map((param) => {
      if (isString(param)) {
        return param;
      } else {
        return param.toCodeString();
      }
    });
    return String.raw(this.template!, ...substitutions);
  }

  toDraftString(language: Language): string {
    return String.raw(
      this.template,
      this.params.map((param) => {
        if (typeof param === "string") {
          return param;
        } else {
          return param.toDraftString(language);
        }
      })
    );
  }
}
