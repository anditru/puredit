import { parser } from "@puredit/projection-parser";
import { Tree, TreeCursor, SyntaxNode } from "@lezer/common";

export function parseProjections(projections: string[]): Tree[] {
  return projections.map((projection) => {
    const tree = parser.parse(projection);
    if (containsErrors(tree.topNode)) {
      throw new Error(`SyntaxError: Invalid projection sample: ${projection}`);
    }
    return tree;
  });
}

function containsErrors(node: SyntaxNode) {
  if (node.type.isError) {
    return true;
  }
  for (let child = node.firstChild; child; child = child.nextSibling) {
    if (containsErrors(child)) {
      return true;
    }
  }
  return false;
}

export function getWidgetTokens(cursor: TreeCursor, sample: string): string[] {
  let tokens = [];
  if (cursor.firstChild()) {
    do {
      if (cursor.name === "SubProjectionGroup") {
        continue;
      } else if (["Projection", "ProjectionContent", "WordSequence"].includes(cursor.name)) {
        tokens = getWidgetTokens(cursor, sample);
      } else if (["MiddleWidget", "EndWidget"].includes(cursor.name)) {
        tokens.push(getWidgetTokens(cursor, sample));
      } else if (["Word", "Comma"].includes(cursor.name)) {
        tokens.push(sample.slice(cursor.from, cursor.to));
      }
    } while (cursor.nextSibling());
    cursor.parent();
  }
  return tokens;
}

export function getWidgetBoundries(tree: Tree): number[] {
  const cursor = tree.cursor();
  const boundries = [];
  if (cursor.firstChild()) {
    do {
      if (["MiddleWidget", "EndWidget"].includes(cursor.type.name)) boundries.push(cursor.node.to);
    } while (cursor.nextSibling());
  }
  return boundries;
}

export function getSubProjectionGroups(cursor: TreeCursor): SyntaxNode[] {
  let subProjectionGroups = [];
  if (cursor.firstChild()) {
    do {
      if (cursor.name === "SubProjectionGroup") {
        subProjectionGroups.push(cursor.node);
      }
      subProjectionGroups = subProjectionGroups.concat(getSubProjectionGroups(cursor));
    } while (cursor.nextSibling());
    cursor.parent();
  }
  return subProjectionGroups;
}

export function getWidgetTexts(subProjectionGroup: SyntaxNode, text: string) {
  const subProjections = subProjectionGroup.getChildren("ProjectionContent");
  return subProjections
    .map((subProjectionContent) => serializeSubProjection(subProjectionContent, text))
    .join("\n");
}

function serializeSubProjection(projectionContent: SyntaxNode, text: string) {
  const cursor = projectionContent.cursor();
  let result = "";
  if (cursor.firstChild()) {
    do {
      if (cursor.name === "SubProjectionGroup") {
        result += " [...] ";
      } else {
        result += text.slice(cursor.from, cursor.to).trim();
      }
    } while (cursor.nextSibling());
  }
  return result;
}
