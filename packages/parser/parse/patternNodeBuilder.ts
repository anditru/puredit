import type { Target, TreeSitterParser } from "../treeSitterParser";
import type { TreeCursor } from "web-tree-sitter";
import type { TemplateBlock } from "..";
import {
  isErrorToken,
  isKeyword,
  isTopNode,
  shouldTreatAsAtomicNode,
} from "../shared";
import type {
  Context,
  PatternMap,
  PatternNode,
  TemplateArg,
  TemplateContextVariable,
  TemplateParam,
} from "../types";
import { isString } from "@puredit/utils";

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
    const cursor = parser.parse(code).walk();
    if (isExpression) {
      goToExpression(cursor);
    }
    const root = visitNode(cursor, code, args, blocks, contextVariables)[0];
    if (isTopNode(root) && root.children) {
      return root.children[0];
    }
    return root;
  }
}

function goToExpression(cursor: TreeCursor) {
  do {
    if (cursor.nodeType === "expression_statement") {
      cursor.gotoFirstChild();
      return;
    }
  } while (goToNextNode(cursor));
}

function goToNextNode(cursor: TreeCursor): boolean {
  return (
    cursor.gotoFirstChild() ||
    cursor.gotoNextSibling() ||
    (cursor.gotoParent() && cursor.gotoNextSibling())
  );
}

export function visitNode(
  cursor: TreeCursor,
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
    if (isKeyword(cursor)) {
      continue;
    }
    let node: PatternNode = {
      type: cursor.nodeType,
      fieldName: cursor.currentFieldName() || undefined,
    };
    if (!shouldTreatAsAtomicNode(cursor) && cursor.gotoFirstChild()) {
      node.children = visitNode(cursor, code, args, blocks, contextVariables);
      if (
        (node.type === "block" || node.type === "expression_statement") &&
        node.children[0].type === "TemplateBlock"
      ) {
        const fieldName = node.fieldName;
        node = node.children[0];
        node.fieldName = fieldName;
      }
      cursor.gotoParent();
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
  } while (cursor.gotoNextSibling());
  return nodes;
}

/**
 * Converts an array fo PatterNodes to map that groups the patterns by their type.
 * @param patterns The array of patterns to group
 * @returns Pattern map (NodeType -> Array of PatternNodes of the respective type)
 */
export function createPatternMap(patterns: PatternNode[]): PatternMap {
  const patternMap: PatternMap = {};
  for (const pattern of patterns) {
    if (patternMap[pattern.type]) {
      patternMap[pattern.type].push(pattern);
    } else {
      patternMap[pattern.type] = [pattern];
    }
  }
  return patternMap;
}
