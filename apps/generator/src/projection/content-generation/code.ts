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
    const nodeComparison = new NodeComparison(cursor, samples[i].walk(), language);
    [nodes, variablePaths] = nodeComparison.execute(ignoreBlocks);
    cursor = new PatternCursor(nodes[0]);
  }
  return { pattern: nodes[0], variablePaths };
}

class NodeComparison {
  // Input
  private ignoreBlocks = false;
  private blockNodeType: string;

  // State
  private path: Path;

  // Output
  private nodes: PatternNode[] = [];
  private variablePaths: Path[] = [];

  constructor(private a: TreeCursor, private b: TreeCursor, private language: Language) {
    this.blockNodeType = loadBlocksConfigFor(this.language).blockNodeType;
  }

  execute(ignoreBlocks: boolean, path: Path = []): [PatternNode[], Path[]] | null {
    this.ignoreBlocks = ignoreBlocks;
    this.path = path;
    let hasSibling = true;
    for (let index = 0; hasSibling; index++) {
      const fieldNameA = this.a.currentFieldName() || undefined;
      const fieldNameB = this.b.currentFieldName() || undefined;
      if (fieldNameA !== fieldNameB) {
        // mismatch (parent)
        return null;
      }
      if (this.a.nodeType !== this.b.nodeType) {
        if (!this.a.nodeIsNamed || !this.b.nodeIsNamed) {
          // keywords cannot be variable
          // mismatch (parent)
          return null;
        }
        // mismatch (current, wildcard)
        this.variablePaths.push(this.path.concat(index));
        this.nodes.push({
          variable: true,
          type: "*",
          fieldName: fieldNameA,
        });
      } else if (
        !this.ignoreBlocks &&
        this.a.nodeType === this.blockNodeType &&
        this.b.nodeType === this.blockNodeType
      ) {
        this.variablePaths.push(this.path.concat(index));
        this.nodes.push({
          variable: true,
          fieldName: fieldNameA,
          type: this.a.nodeType,
        });
      } else {
        const hasChildrenA = gotoFirstChild(this.a);
        const hasChildrenB = gotoFirstChild(this.b);
        if (hasChildrenA !== hasChildrenB) {
          // mismatch (current, same node type)
          if (hasChildrenA) {
            this.a.gotoParent();
          }
          if (hasChildrenB) {
            this.b.gotoParent();
          }
          this.variablePaths.push(this.path.concat(index));
          this.nodes.push({
            variable: true,
            fieldName: fieldNameA,
            type: this.a.nodeType,
          });
        } else if (hasChildrenA && hasChildrenB) {
          const childNodeComparison = new NodeComparison(this.a, this.b, this.language);
          const result = childNodeComparison.execute(this.ignoreBlocks, this.path.concat(index));
          this.a.gotoParent();
          this.b.gotoParent();
          if (result) {
            const [children, childVariables] = result;
            this.variablePaths = this.variablePaths.concat(childVariables);
            this.nodes.push({
              fieldName: fieldNameA,
              type: this.a.nodeType,
              children,
            });
          } else {
            // mismatch (current, same node type)
            this.variablePaths.push(this.path.concat(index));
            this.nodes.push({
              variable: true,
              fieldName: fieldNameA,
              type: this.a.nodeType,
            });
          }
        } else if (this.a.nodeText !== this.b.nodeText) {
          // mismatch (current, same node type)
          this.variablePaths.push(this.path.concat(index));
          this.nodes.push({
            variable: true,
            fieldName: fieldNameA,
            type: this.a.nodeType,
          });
        } else {
          this.nodes.push({
            fieldName: fieldNameA,
            type: this.a.nodeType,
            text: this.a.nodeText,
          });
        }
      }

      const hasSiblingA = this.a.gotoNextSibling();
      const hasSiblingB = this.b.gotoNextSibling();
      if (hasSiblingA !== hasSiblingB) {
        // mismatch (parent)
        return null;
      }
      hasSibling = hasSiblingA && hasSiblingB;
    }
    return [this.nodes, this.variablePaths];
  }
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
