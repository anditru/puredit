import type { Target, TreeSitterParser } from "../treeSitterParser";
import type { TemplateBlock } from "..";
import { isTopNode } from "../common";
import {
  TemplatePrefixes,
  type Context,
  type PatternNode,
  type TemplateArg,
  type TemplateContextVariable,
  type TemplateParam,
} from "../types";
import { isString } from "@puredit/utils";
import { AstCursor } from "../astCursor";
import { NodeTransformVisitor } from "./nodeTransformVisitor";

export class PatternTreeBuilder {
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

  setTemplate(template: TemplateStringsArray): PatternTreeBuilder {
    this.template = template;
    return this;
  }

  setParams(params: (string | TemplateParam)[]): PatternTreeBuilder {
    this.params = params;
    return this;
  }

  setIsExpression(isExpression: boolean): PatternTreeBuilder {
    this.isExpression = isExpression;
    return this;
  }

  build(): PatternNode {
    const raw = this.buildRawString();
    const draft = this.getDraftFunction();

    const cursor = new AstCursor(this.parser!.parse(raw).walk());
    if (this.isExpression) {
      cursor.goToExpression();
    }

    const nodeTransformVisitor = new NodeTransformVisitor(
      this.args,
      this.blocks,
      this.contextVariables
    );
    let rootPatternNode = nodeTransformVisitor.visit(cursor, raw)[0];
    if (isTopNode(rootPatternNode) && rootPatternNode.children) {
      rootPatternNode = rootPatternNode.children[0];
    }

    return {
      ...rootPatternNode,
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
          return TemplatePrefixes.Arg + (this.args.push(param) - 1).toString();
        }
        if (param.kind === "block") {
          param.blockType = this.target!;
          return (
            TemplatePrefixes.Block + (this.blocks.push(param) - 1).toString()
          );
        }
        if (param.kind === "contextVariable") {
          return (
            TemplatePrefixes.ContextVariable +
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
