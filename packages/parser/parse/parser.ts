import type { TreeSitterParser } from "../treeSitterParser";
import { createTreeSitterParser, Target } from "../treeSitterParser";
import type { AggPart, PatternNode, TemplateParam } from "../types";
import { PatternTreeBuilder } from "./patternTreeBuilder";

export default class Parser {
  static async load(target: Target): Promise<Parser> {
    const treeSitterParser = await createTreeSitterParser(target);
    return new Parser(treeSitterParser, target);
  }

  patternNodeBuilder: PatternTreeBuilder;

  private constructor(
    private treeSitterParser: TreeSitterParser,
    public target: Target
  ) {
    this.patternNodeBuilder = new PatternTreeBuilder(treeSitterParser, target);
  }

  parse(
    input: string | TreeSitterParser.Input,
    previousTree?: TreeSitterParser.Tree,
    options?: TreeSitterParser.Options
  ): TreeSitterParser.Tree {
    return this.treeSitterParser.parse(input, previousTree, options);
  }

  aggPartPattern(
    template: TemplateStringsArray,
    ...params: (string | TemplateParam)[]
  ): AggPart {
    return {
      template,
      params,
    };
  }

  /**
   * Builds a Statement Pattern
   * @param template String pices of the template
   * @param params Active nodes in the pattern
   * @returns PatternNode
   */
  statementPattern(
    template: TemplateStringsArray,
    ...params: (string | TemplateParam)[]
  ): PatternNode {
    return this.patternNodeBuilder
      .setTemplate(template)
      .setParams(params)
      .setIsExpression(false)
      .build();
  }

  /**
   * Builds an Expression Pattern
   * @param template String pices of the template
   * @param params Active nodes in the pattern
   * @returns PatternNode
   */
  expressionPattern(
    template: TemplateStringsArray,
    ...params: (string | TemplateParam)[]
  ): PatternNode {
    return this.patternNodeBuilder
      .setTemplate(template)
      .setParams(params)
      .setIsExpression(true)
      .build();
  }
}
