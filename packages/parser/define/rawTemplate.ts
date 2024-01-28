import { isString } from "@puredit/utils";
import TemplateParameter from "./templateParameter";
import TemplateAggregation from "./templateAggregation";

export default class RawTemplate {
  constructor(
    public readonly template: TemplateStringsArray,
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
}
