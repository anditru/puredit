import TemplateParameter from "../template/parameters/templateParameter";
import Template from "../template/template";
import type { TreeSitterParser } from "../treeSitterParser";
import { createTreeSitterParser } from "../treeSitterParser";
import { Language } from "@puredit/language-config";
import { CompletePatternGeneration } from "./internal";
import { isString } from "@puredit/utils";

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
   * @returns Template
   */
  subPattern(name: string) {
    return (templateStrings: TemplateStringsArray, ...params: (string | TemplateParameter)[]) => {
      const template = new Template(name, this.language, templateStrings, params);
      params.forEach((param) => {
        if (!isString(param)) {
          param.template = template;
        }
      });
      return template;
    };
  }

  /**
   * Parses a statement pattern
   * @param name Name of the statement pattern
   * @returns Pattern
   */
  statementPattern(name: string) {
    return (templateStrings: TemplateStringsArray, ...params: (string | TemplateParameter)[]) => {
      const template = new Template(name, this.language, templateStrings, params);
      params.forEach((param) => {
        if (!isString(param)) {
          param.template = template;
        }
      });
      return this.patternGeneration.setTemplate(template).setIsExpression(false).execute();
    };
  }

  /**
   * Parses an expression pattern
   * @param name Name of the expression pattern
   * @returns Pattern
   */
  expressionPattern(name: string) {
    return (templateStrings: TemplateStringsArray, ...params: (string | TemplateParameter)[]) => {
      const template = new Template(name, this.language, templateStrings, params);
      params.forEach((param) => {
        if (!isString(param)) {
          param.template = template;
        }
      });
      return this.patternGeneration.setTemplate(template).setIsExpression(true).execute();
    };
  }
}
