/**
 * @module define
 * Implements functions to define patterns with active nodes.
 */

import { isString } from "@puredit/utils";
import { parsePattern } from "./pattern";
import type {
  Context,
  PatternDraft,
  PatternNode,
  TemplateArg,
  TemplateBlock,
  TemplateContextVariable,
  TemplateParam,
} from "./types";
import { Target, TreeSitterParser } from "./treeSitterParser";

/**
 * Defines an Argument active node
 * @param name Name of the Argument
 * @param type Type of the Argument
 * @returns Object representing the Argument
 */
export function arg(name: string, types: string[]): TemplateArg {
  return {
    kind: "arg",
    name,
    types,
  };
}

/**
 * Defines a Block active node
 * @param context Context Variables required in the Block
 * @returns Object representing the Block
 */
export function block(context: Context = {}): TemplateBlock {
  return {
    kind: "block",
    context,
    blockType: Target.TypeScript,
  };
}

/**
 * Defines a Context Variable active node
 * @param name Name of the Context Variable
 * @returns Object representing the Context Variable
 */
export function contextVariable(name: string): TemplateContextVariable {
  return {
    kind: "contextVariable",
    name,
  };
}

/**
 * Builds a pattern. A pattern is defined as a tuple of a PatternNode and a PatternDraft
 * @param template String pices of the template
 * @param params Active nodes in the pattern
 * @param parser TreeSitter Parser for the target language
 * @param target Target language
 * @param isExpression Is an expression pattern
 * @returns Tuple of a PatternNode and PatternDraft
 */
export function pattern(
  template: TemplateStringsArray,
  params: (string | TemplateParam)[],
  parser: TreeSitterParser,
  target: Target,
  isExpression: boolean
): [PatternNode, PatternDraft] {
  const args: TemplateArg[] = [];
  const blocks: TemplateBlock[] = [];
  const contextVariables: TemplateContextVariable[] = [];
  const raw = String.raw(
    template,
    ...params.map((param) => {
      if (isString(param)) {
        return param;
      }
      if (param.kind === "arg") {
        return "__template_arg_" + (args.push(param) - 1).toString();
      }
      if (param.kind === "block") {
        param.blockType = target;
        return "__template_block_" + (blocks.push(param) - 1).toString();
      }
      if (param.kind === "contextVariable") {
        return (
          "__template_context_variable_" +
          (contextVariables.push(param) - 1).toString()
        );
      }
    })
  );
  const draft = (context: Context) =>
    String.raw(
      template,
      ...params.map((param) => {
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
  return [
    parsePattern(raw, parser, args, blocks, contextVariables, isExpression),
    draft,
  ];
}
