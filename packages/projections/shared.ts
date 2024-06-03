import { tags } from "@lezer/highlight";
import type { EditorView } from "@codemirror/view";
import { highlightingFor } from "@codemirror/language";
import type { EditorState, ChangeSpec } from "@codemirror/state";
import type { Text } from "@codemirror/state";
import type { Match } from "@puredit/parser";
import { ProjectionWidget } from "./widget/widget";
import type AstNode from "@puredit/parser/ast/node";
import { ContextInformation, RootProjection } from "./types";

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

export const staticWidget = (initialize: (state: EditorState) => HTMLElement) =>
  class extends ProjectionWidget {
    protected initialize(
      _match: Match,
      _context: ContextInformation,
      state: EditorState
    ): HTMLElement {
      return initialize(state);
    }

    protected update(): void {
      return;
    }

    toDOM(view: EditorView): HTMLElement {
      const dom = super.toDOM(view);
      dom.addEventListener("click", () => {
        view.dispatch({
          selection: {
            anchor: this.match.node.startIndex,
            head: this.match.node.endIndex,
          },
        });
      });
      return dom;
    }
  };

export const validateFromList = (allowedValues: string[]) => (value: string) => {
  if (!allowedValues.includes(value)) {
    return `invalid value ${value}`;
  }
};

export function toRootProjectionMap(projections: RootProjection[]) {
  return new Map(projections.map((p: RootProjection) => [p.pattern, p]));
}

export function toSubProjectionMap(projections: RootProjection[]) {
  return new Map(
    projections.flatMap((p: RootProjection) => p.subProjections.map((s) => [s.template, s]))
  );
}
