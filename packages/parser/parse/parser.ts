import TemplateParameter from "../define/templateParameter";
import RawTemplate from "../define/rawTemplate";
import type { TreeSitterParser } from "../treeSitterParser";
import { createTreeSitterParser } from "../treeSitterParser";
import { Language } from "@puredit/language-config";
import { CompletePatternGeneration } from "./internal";

export default class Parser {
  static async load(target: Language): Promise<Parser> {
    const treeSitterParser = await createTreeSitterParser(target);
    return new Parser(treeSitterParser, target);
  }

  patternGeneration: CompletePatternGeneration;

  private constructor(
    private treeSitterParser: TreeSitterParser,
    public readonly target: Language
  ) {
    this.patternGeneration = new CompletePatternGeneration(treeSitterParser, target);
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
      return new RawTemplate(template, params, name);
    };
  }

  /**
   * Parses a statement pattern
   * @param name Name of the statement pattern
   * @returns Pattern
   */
  statementPattern(name: string) {
    return (template: TemplateStringsArray, ...params: (string | TemplateParameter)[]) => {
      const rawTemplate = new RawTemplate(template, params, name);
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
      const rawTemplate = new RawTemplate(template, params, name);
      return this.patternGeneration.setRawTemplate(rawTemplate).setIsExpression(true).execute();
    };
  }
}
