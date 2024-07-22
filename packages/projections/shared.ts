import { tags } from "@lezer/highlight";
import { highlightingFor } from "@codemirror/language";
import type { EditorState, ChangeSpec } from "@codemirror/state";
import type { Text } from "@codemirror/state";
import type AstNode from "@puredit/parser/ast/node";

const stringTypes = ["string", "template_string"];

export function isStringNode(node: AstNode): boolean {
  return stringTypes.includes(node.type);
}

export function nodeValue(node: AstNode, text: Text, offsetLeftRight = 0): string {
  return text.sliceString(node.startIndex + offsetLeftRight, node.endIndex - offsetLeftRight);
}

export function stringLiteralValue(node: AstNode, text: Text) {
  if (!isStringNode(node)) {
    return nodeValue(node, text);
  }
  return (
    nodeValue(node, text, 1)
      .replaceAll("\\\\", "\\")
      .replaceAll('\\"', '"')
      .replaceAll("\\'", "'")
      //.replaceAll(" ", "·")
      .replaceAll("\n", "↵")
  );
}

export function nodeValueChange(node: AstNode, newValue: string, offsetLeftRight = 0): ChangeSpec {
  return {
    from: node.startIndex + offsetLeftRight,
    to: node.endIndex - offsetLeftRight,
    insert: newValue,
  };
}

export function stringLiteralValueChange(node: AstNode, newValue: string): ChangeSpec {
  if (!isStringNode(node)) {
    return nodeValueChange(node, newValue);
  }
  return nodeValueChange(
    node,
    newValue
      .replaceAll("\\", "\\\\")
      .replaceAll('"', '\\"')
      .replaceAll("'", "\\'")
      //.replaceAll("·", " ")
      .replaceAll("↵", "\n"),
    1
  );
}

export function bold(text: string): HTMLElement {
  const el = document.createElement("b");
  el.textContent = text;
  return el;
}

export function keyword(text: string, state: EditorState): HTMLElement {
  const el = document.createElement("span");
  el.className = highlightingFor(state, [tags.keyword]) || "";
  el.textContent = text;
  return el;
}

export function span(text: string): HTMLElement {
  const el = document.createElement("span");
  el.textContent = text;
  return el;
}

export const validateFromList = (allowedValues: string[]) => (value: string) => {
  if (!allowedValues.includes(value)) {
    return `invalid value ${value}`;
  }
};
