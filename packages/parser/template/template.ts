import TemplateParameter from "./parameters/templateParameter";
import TemplateAggregation from "./parameters/templateAggregation";
import TemplateChain from "./parameters/templateChain";
import { Language } from "@puredit/language-config";
import CodeString from "./codeString";
import Pattern from "../pattern/pattern";
import ReferencePattern from "../pattern/referencePattern";

export type Template = TransformableTemplate | ReferenceTemplate;

export class TransformableTemplate {
  private patterns: Pattern[] = [];

  constructor(
    public readonly name: string,
    public readonly language: Language,
    public readonly templateStrings: TemplateStringsArray,
    public readonly params: TemplateParameter[]
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

  toCodeString(language: Language): CodeString {
    return CodeString.fromTemplate(this, language);
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

  addPattern(pattern: Pattern) {
    this.patterns.push(pattern);
  }

  getPatterns(): Pattern[] {
    return this.patterns;
  }
}

export class ReferenceTemplate {
  constructor(public readonly name: string) {}

  toPattern(): Pattern {
    return new ReferencePattern(this.name);
  }
}
