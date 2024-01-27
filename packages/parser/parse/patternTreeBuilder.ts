import type { Target, TreeSitterParser } from "../treeSitterParser";
import type { TemplateBlock } from "..";
import { isTopNode } from "../common";
import {
  TemplateNodeKind,
  TemplatePrefix,
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
    this.categorizeParams();
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

  categorizeParams(): void {
    this.params?.forEach((param) => {
      if (isString(param)) {
        return;
      }
      if (param.kind === TemplateNodeKind.Arg) {
        this.args.push(param);
      }
      if (param.kind === TemplateNodeKind.Block) {
        this.blocks.push(param);
      }
      if (param.kind === TemplateNodeKind.ContextVariable) {
        this.contextVariables.push(param);
      }
    });
  }

  buildRawString() {
    const substitutions = this.params!.map((param) => {
      if (isString(param)) {
        return param;
      }
      if (param.kind === TemplateNodeKind.Arg) {
        return TemplatePrefix.Arg + this.args.indexOf(param).toString();
      }
      if (param.kind === TemplateNodeKind.Block) {
        param.blockType = this.target!;
        return TemplatePrefix.Block + this.blocks.indexOf(param).toString();
      }
      if (param.kind === TemplateNodeKind.ContextVariable) {
        return (
          TemplatePrefix.ContextVariable +
          this.contextVariables.indexOf(param).toString()
        );
      }
    });

    return String.raw(this.template!, ...substitutions);
  }

  getDraftFunction() {
    return (context: Context) =>
      String.raw(
        this.template!,
        ...this.params!.map((param) => {
          if (isString(param)) {
            return param;
          }
          if (param.kind === TemplateNodeKind.Arg) {
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
          if (param.kind === TemplateNodeKind.Block) {
            switch (param.blockType) {
              case "ts":
                return "{\n  // instructions go here\n}";
              case "py":
                return "pass # instructions go here";
            }
          }
          if (param.kind === TemplateNodeKind.ContextVariable) {
            return Object.prototype.hasOwnProperty.call(context, param.name)
              ? context[param.name]
              : param.name;
          }
        })
      ).trim();
  }
}
