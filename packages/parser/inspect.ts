/**
 * @module inspect
 * Implements a set of functions to convert patterns, ast-nodes and matches to their
 * string representation
 */

import { NodeTransformVisitor } from "./parse/nodeTransformVisitor";
import type { ArgMap, Match } from "./match/types";
import AstNode from "./ast/node";
import PatternNode from "./pattern/nodes/patternNode";

export function patternToString(node: PatternNode, indent = ""): string {
  let out = indent + (node.fieldName ? node.fieldName + ": " : "") + node.type;
  if (node.children) {
    out +=
      " {\n" +
      node.children.map((child) => patternToString(child, indent + "  ")).join("") +
      indent +
      "}\n";
  } else if (node.text) {
    out += " " + JSON.stringify(node.text) + "\n";
  }
  return out;
}

export function syntaxNodeToString(node: AstNode, text: string, indent = ""): string {
  const nodeTransformVisitor = new NodeTransformVisitor([]);
  return patternToString(nodeTransformVisitor.visit(node.walk(), text)[0], indent);
}

export function argMapToString(args: ArgMap, text: string, indent = ""): string {
  let out = "{\n";
  for (const key of Object.keys(args)) {
    out +=
      indent +
      `  ${key} = {\n${syntaxNodeToString(args[key], text, indent + "    ") + indent}  }\n`;
  }
  return out + indent + "}";
}

export function matchToString(match: Match, text: string): string {
  return `Match {
  args = ${argMapToString(match.args, text, "  ")}
}`;
}
