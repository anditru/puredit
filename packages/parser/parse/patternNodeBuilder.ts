import type { Target, TreeSitterParser } from "../treeSitterParser";
import type { TemplateBlock } from "..";
import { isErrorToken, isTopNode } from "../common";
import type {
  Context,
  PatternMap,
  PatternNode,
  TemplateArg,
  TemplateContextVariable,
  TemplateParam,
} from "../types";
import { isString } from "@puredit/utils";
import { AstCursor } from "../astCursor";

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
      ...this.parsePattern(
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

  private parsePattern(
    code: string,
    parser: TreeSitterParser,
    args: TemplateArg[] = [],
    blocks: TemplateBlock[] = [],
    contextVariables: TemplateContextVariable[] = [],
    isExpression = false
  ): PatternNode {
    const cursor = new AstCursor(parser.parse(code).walk());
    if (isExpression) {
      cursor.goToExpression();
    }
    const root = visitNode(cursor, code, args, blocks, contextVariables)[0];
    if (isTopNode(root) && root.children) {
      return root.children[0];
    }
    return root;
  }
}

export function visitNode(
  cursor: AstCursor,
  code: string,
  args: TemplateArg[],
  blocks: TemplateBlock[],
  contextVariables: TemplateContextVariable[]
): PatternNode[] {
  const nodes = [];
  do {
    if (isErrorToken(cursor.nodeType)) {
      throw new Error(
        `error in pattern ast at position ${cursor.startIndex}: ${cursor.nodeText}`
      );
    }
    // Skip keywords
    if (cursor.isKeyword()) {
      continue;
    }
    let node: PatternNode = {
      type: cursor.nodeType,
      fieldName: cursor.currentFieldName || undefined,
    };
    if (!cursor.shouldTreatAsAtomicNode() && cursor.goToFirstChild()) {
      node.children = visitNode(cursor, code, args, blocks, contextVariables);
      if (
        (node.type === "block" || node.type === "expression_statement") &&
        node.children[0].type === "TemplateBlock"
      ) {
        const fieldName = node.fieldName;
        node = node.children[0];
        node.fieldName = fieldName;
      }
      cursor.goToParent();
    } else {
      node.text = cursor.nodeText;
      if (node.text.startsWith("__template_arg_")) {
        const index = parseInt(node.text.slice("__template_arg_".length));
        node.arg = args[index];
        node.type = "TemplateArg";
      } else if (node.text.startsWith("__template_block_")) {
        const index = parseInt(node.text.slice("__template_block_".length));
        node.block = blocks[index];
        node.type = "TemplateBlock";
      } else if (node.text.startsWith("__template_context_variable_")) {
        const index = parseInt(
          node.text.slice("__template_context_variable_".length)
        );
        node.contextVariable = contextVariables[index];
        node.type = "TemplateContextVariable";
      }
    }
    nodes.push(node);
  } while (cursor.goToNextSibling());
  return nodes;
}
