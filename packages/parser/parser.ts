import type { TreeSitterParser } from "./treeSitterParser";
import { createTreeSitterParser, Target } from "./treeSitterParser";
import { isString } from "@puredit/utils";
import { parsePattern } from "./pattern";
import type {
  AggPart,
  Context,
  PatternNode,
  TemplateArg,
  TemplateBlock,
  TemplateContextVariable,
  TemplateParam,
} from "./types";

export default class Parser {
  static async load(target: Target): Promise<Parser> {
    const tsParser = await createTreeSitterParser(target);
    return new Parser(tsParser, target);
  }

  patternNodeBuilder: PatternNodeBuilder;

  private constructor(
    private tsParser: TreeSitterParser,
    public target: Target
  ) {
    this.patternNodeBuilder = new PatternNodeBuilder(tsParser, target);
  }

  parse(
    input: string | TreeSitterParser.Input,
    previousTree?: TreeSitterParser.Tree,
    options?: TreeSitterParser.Options
  ): TreeSitterParser.Tree {
    return this.tsParser.parse(input, previousTree, options);
  }

  parsePattern(
    code: string,
    args: TemplateArg[] = [],
    blocks: TemplateBlock[] = [],
    contextVariables: TemplateContextVariable[] = [],
    isExpression = false
  ): PatternNode {
    return parsePattern(
      code,
      this.tsParser,
      args,
      blocks,
      contextVariables,
      isExpression
    );
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

export class PatternNodeBuilder {
  private template: TemplateStringsArray | undefined;
  private params: (string | TemplateParam)[] | undefined;
  private isExpression: boolean | undefined;

  private args: TemplateArg[] = [];
  private blocks: TemplateBlock[] = [];
  private contextVariables: TemplateContextVariable[] = [];

  constructor(
    private readonly parser: TreeSitterParser | undefined,
    private readonly target: Target | undefined
  ) {}

  setTemplate(template: TemplateStringsArray): PatternNodeBuilder {
    this.template = template;
    return this;
  }

  setParams(params: (string | TemplateParam)[]): PatternNodeBuilder {
    this.params = params;
    return this;
  }

  setIsExpression(isExpression: boolean): PatternNodeBuilder {
    this.isExpression = isExpression;
    return this;
  }

  build(): PatternNode {
    const raw = this.buildRawString();
    const draft = this.getDraftFunction();
    return {
      ...parsePattern(
        raw,
        this.parser!,
        this.args,
        this.blocks,
        this.contextVariables,
        this.isExpression
      ),
      draft,
    };
  }

  buildRawString(): string {
    return String.raw(
      this.template!,
      ...this.params!.map((param) => {
        if (isString(param)) {
          return param;
        }
        if (param.kind === "arg") {
          return "__template_arg_" + (this.args.push(param) - 1).toString();
        }
        if (param.kind === "block") {
          param.blockType = this.target!;
          return "__template_block_" + (this.blocks.push(param) - 1).toString();
        }
        if (param.kind === "contextVariable") {
          return (
            "__template_context_variable_" +
            (this.contextVariables.push(param) - 1).toString()
          );
        }
      })
    );
  }

  getDraftFunction() {
    return (context: Context) =>
      String.raw(
        this.template!,
        ...this.params!.map((param) => {
          if (isString(param)) {
            return param;
          }
          if (param.kind === "arg") {
            switch (param.types[0]) {
              case "string":
                return '""';
              case "number":
                return "1";
              case "list":
                return "[]";
              default:
                return `__empty_${param.types[0]}`;
            }
          }
          if (param.kind === "block") {
            switch (param.blockType) {
              case "ts":
                return "{\n  // instructions go here\n}";
              case "py":
                return "pass # instructions go here";
            }
          }
          if (param.kind === "contextVariable") {
            return Object.prototype.hasOwnProperty.call(context, param.name)
              ? context[param.name]
              : param.name;
          }
        })
      ).trim();
  }
}
