import TemplateParameter from "../define/templateParameter";
import RawTemplate from "../define/rawTemplate";
import type { TreeSitterParser } from "../treeSitterParser";
import { createTreeSitterParser } from "../treeSitterParser";
import { Language } from "@puredit/language-config";
import { CompletePatternGeneration } from "./internal";

export default class Parser {
  static async load(language: Language): Promise<Parser> {
    const treeSitterParser = await createTreeSitterParser(language);
    return new Parser(treeSitterParser, language);
  }

  patternGeneration: CompletePatternGeneration;

  private constructor(
    private treeSitterParser: TreeSitterParser,
    public readonly language: Language
  ) {
    this.patternGeneration = new CompletePatternGeneration(treeSitterParser);
  }

  parse(
    input: string | TreeSitterParser.Input,
    previousTree?: TreeSitterParser.Tree,
    options?: TreeSitterParser.Options
  ): TreeSitterParser.Tree {
    return this.treeSitterParser.parse(input, previousTree, options);
  }

  /**
   * Parses an aggregation subpattern
   * @param name Name of the aggregation subpattern
   * @returns RawTemplate
   */
  subPattern(name: string) {
    return (template: TemplateStringsArray, ...params: (string | TemplateParameter)[]) => {
      return new RawTemplate(name, this.language, template, params);
    };
  }

  /**
   * Parses a statement pattern
   * @param name Name of the statement pattern
   * @returns Pattern
   */
  statementPattern(name: string) {
    return (template: TemplateStringsArray, ...params: (string | TemplateParameter)[]) => {
      const rawTemplate = new RawTemplate(name, this.language, template, params);
      return this.patternGeneration.setRawTemplate(rawTemplate).setIsExpression(false).execute();
    };
  }

  /**
   * Parses an expression pattern
   * @param name Name of the expression pattern
   * @returns Pattern
   */
  expressionPattern(name: string) {
    return (template: TemplateStringsArray, ...params: (string | TemplateParameter)[]) => {
      const rawTemplate = new RawTemplate(name, this.language, template, params);
      return this.patternGeneration.setRawTemplate(rawTemplate).setIsExpression(true).execute();
    };
  }
}
