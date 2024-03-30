import type { Tree, TreeCursor } from "web-tree-sitter";
import { PatternCursor, PatternNode } from "./pattern";
import { Language } from "./common";
import { loadBlocksConfigFor } from "@puredit/language-config";
import { getUndeclaredVarSearchFor } from "./context-var-detection/factory";
import AstNode from "@puredit/parser/ast/node";
import { BlockVariableMap, Path } from "./context-var-detection/blockVariableMap";

export function scanCode(samples: Tree[], language: Language, ignoreBlocks: boolean) {
  let variablePaths: Path[] = [];
  let nodes: PatternNode[] = [];
  let cursor = samples[0].walk();
  for (let i = 1; i < samples.length; i++) {
    [nodes, variablePaths] = compareNodes(cursor, samples[i].walk(), language, ignoreBlocks);
    cursor = new PatternCursor(nodes[0]);
  }
  return { pattern: nodes[0], variablePaths };
}

function compareNodes(
  a: TreeCursor,
  b: TreeCursor,
  language: Language,
  ignoreBlocks: boolean,
  path: Path = []
): [PatternNode[], Path[]] | null {
  const blockNodeType = loadBlocksConfigFor(language).blockNodeType;
  const nodes: PatternNode[] = [];
  let variablePaths: Path[] = [];

  let hasSibling = true;
  for (let index = 0; hasSibling; index++) {
    const fieldNameA = a.currentFieldName() || undefined;
    const fieldNameB = b.currentFieldName() || undefined;
    if (fieldNameA !== fieldNameB) {
      // mismatch (parent)
      return null;
    }
    if (a.nodeType !== b.nodeType) {
      if (!a.nodeIsNamed || !b.nodeIsNamed) {
        // keywords cannot be variable
        // mismatch (parent)
        return null;
      }
      // mismatch (current, wildcard)
      variablePaths.push(path.concat(index));
      nodes.push({
        variable: true,
        type: "*",
        fieldName: fieldNameA,
      });
    } else if (!ignoreBlocks && a.nodeType === blockNodeType && b.nodeType === blockNodeType) {
      variablePaths.push(path.concat(index));
      nodes.push({
        variable: true,
        fieldName: fieldNameA,
        type: a.nodeType,
      });
    } else {
      const hasChildrenA = gotoFirstChild(a);
      const hasChildrenB = gotoFirstChild(b);
      if (hasChildrenA !== hasChildrenB) {
        // mismatch (current, same node type)
        if (hasChildrenA) {
          a.gotoParent();
        }
        if (hasChildrenB) {
          b.gotoParent();
        }
        variablePaths.push(path.concat(index));
        nodes.push({
          variable: true,
          fieldName: fieldNameA,
          type: a.nodeType,
        });
      } else if (hasChildrenA && hasChildrenB) {
        const result = compareNodes(a, b, language, ignoreBlocks, path.concat(index));
        a.gotoParent();
        b.gotoParent();
        if (result) {
          const [children, childVariables] = result;
          variablePaths = variablePaths.concat(childVariables);
          nodes.push({
            fieldName: fieldNameA,
            type: a.nodeType,
            children,
          });
        } else {
          // mismatch (current, same node type)
          variablePaths.push(path.concat(index));
          nodes.push({
            variable: true,
            fieldName: fieldNameA,
            type: a.nodeType,
          });
        }
      } else if (a.nodeText !== b.nodeText) {
        // mismatch (current, same node type)
        variablePaths.push(path.concat(index));
        nodes.push({
          variable: true,
          fieldName: fieldNameA,
          type: a.nodeType,
        });
      } else {
        nodes.push({
          fieldName: fieldNameA,
          type: a.nodeType,
          text: a.nodeText,
        });
      }
    }

    const hasSiblingA = a.gotoNextSibling();
    const hasSiblingB = b.gotoNextSibling();
    if (hasSiblingA !== hasSiblingB) {
      // mismatch (parent)
      return null;
    }
    hasSibling = hasSiblingA && hasSiblingB;
  }
  return [nodes, variablePaths];
}

function gotoFirstChild(cursor: TreeCursor): boolean {
  if (cursor.nodeType === "string") {
    return false;
  }
  return cursor.gotoFirstChild();
}

export function findUndeclaredVariables(
  samples: Tree[],
  language: Language,
  ignoreBlocks: boolean
): BlockVariableMap {
  let undeclaredVariableSearch = getUndeclaredVarSearchFor(
    language,
    new AstNode(samples[0].rootNode)
  );
  const undeclaredVariableMap: BlockVariableMap = undeclaredVariableSearch.execute(ignoreBlocks);
  samples.slice(1).forEach((sample) => {
    undeclaredVariableSearch = getUndeclaredVarSearchFor(language, new AstNode(sample.rootNode));
    const newUndeclaredVariableMap = undeclaredVariableSearch.execute(ignoreBlocks);
    undeclaredVariableMap.setIntersections(newUndeclaredVariableMap);
  });
  return undeclaredVariableMap;
}
