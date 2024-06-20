import TemplateParameter from "../template/parameters/templateParameter";
import { TransformableTemplate } from "../template/template";
import type { TreeSitterParser } from "../tree-sitter/treeSitterParser";
import { createTreeSitterParser } from "../tree-sitter/treeSitterParser";
import { Language } from "@puredit/language-config";
import { CompleteTemplateTransformer } from "./internal";
import WasmPathProvider from "../tree-sitter/wasmPathProvider";

export default class Parser {
  static async load(language: Language, wasmPathProvider: WasmPathProvider): Promise<Parser> {
    const treeSitterParser = await createTreeSitterParser(language, wasmPathProvider);
    return new Parser(treeSitterParser, language);
  }

  templateTransformer: CompleteTemplateTransformer;

  private constructor(
    public readonly treeSitterParser: TreeSitterParser,
    public readonly language: Language
  ) {
    this.templateTransformer = new CompleteTemplateTransformer(this);
  }

  parse(
    input: string | TreeSitterParser.Input,
    previousTree?: TreeSitterParser.Tree,
    options?: TreeSitterParser.Options
  ): TreeSitterParser.Tree {
    return this.treeSitterParser.parse(input, previousTree, options);
  }

  /**
   * Parses a subpattern
   * @param name Name of the subpattern
   * @returns Template
   */
  subPattern(name: string) {
    return (templateStrings: TemplateStringsArray, ...params: TemplateParameter[]) => {
      const template = new TransformableTemplate(name, templateStrings, params);
      return template;
    };
  }

  /**
   * Parses a statement pattern
   * @param name Name of the statement pattern
   * @returns Pattern
   */
  statementPattern(name: string) {
    return (templateStrings: TemplateStringsArray, ...params: TemplateParameter[]) => {
      const template = new TransformableTemplate(name, templateStrings, params);
      return this.templateTransformer.setTemplate(template).setIsExpression(false).execute();
    };
  }

  /**
   * Parses an expression pattern
   * @param name Name of the expression pattern
   * @returns Pattern
   */
  expressionPattern(name: string) {
    return (templateStrings: TemplateStringsArray, ...params: TemplateParameter[]) => {
      const template = new TransformableTemplate(name, templateStrings, params);
      return this.templateTransformer.setTemplate(template).setIsExpression(true).execute();
    };
  }
}
