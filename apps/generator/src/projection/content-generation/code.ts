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
      if (this.parentMissMatch()) {
        return null;
      }
      if (this.typeMissMatch()) {
        if (this.atLeastOneNodeIsKeyword()) {
          return null; // keywords cannot be variable
        }
        this.recordMissMatchWithWildcard(index);
      } else if (!this.ignoreBlocks && this.nodesAreBlock()) {
        this.recordMissMatch(index);
      } else {
        this.compareChildren(index);
      }

      const hasSiblingA = this.a.gotoNextSibling();
      const hasSiblingB = this.b.gotoNextSibling();
      if (hasSiblingA !== hasSiblingB) {
        return null; // mismatch (parent)
      }
      hasSibling = hasSiblingA && hasSiblingB;
    }
    return [this.nodes, this.variablePaths];
  }

  private parentMissMatch(): boolean {
    return this.a.currentFieldName() !== this.b.currentFieldName();
  }

  private typeMissMatch(): boolean {
    return this.a.nodeType !== this.b.nodeType;
  }

  private atLeastOneNodeIsKeyword(): boolean {
    return !this.a.nodeIsNamed || !this.b.nodeIsNamed;
  }

  private recordMissMatchWithWildcard(index: number) {
    this.variablePaths.push(this.path.concat(index));
    this.nodes.push({
      variable: true,
      type: "*",
      fieldName: this.a.currentFieldName() || undefined,
    });
  }

  private nodesAreBlock(): boolean {
    return this.a.nodeType === this.blockNodeType && this.b.nodeType === this.blockNodeType;
  }

  private recordMissMatch(index: number) {
    this.variablePaths.push(this.path.concat(index));
    this.nodes.push({
      variable: true,
      fieldName: this.a.currentFieldName() || undefined,
      type: this.a.nodeType,
    });
  }

  private compareChildren(index: number) {
    const hasChildrenA = gotoFirstChild(this.a);
    const hasChildrenB = gotoFirstChild(this.b);
    if (hasChildrenA !== hasChildrenB) {
      if (hasChildrenA) {
        this.a.gotoParent();
      }
      if (hasChildrenB) {
        this.b.gotoParent();
      }
      this.recordMissMatch(index);
    } else if (hasChildrenA && hasChildrenB) {
      this.executeChildNodeComparison(index);
    } else if (this.a.nodeText !== this.b.nodeText) {
      this.recordMissMatch(index);
    } else {
      this.nodes.push({
        fieldName: this.a.currentFieldName() || undefined,
        type: this.a.nodeType,
        text: this.a.nodeText,
      });
    }
  }

  private executeChildNodeComparison(index: number) {
    const childNodeComparison = new NodeComparison(this.a, this.b, this.language);
    const result = childNodeComparison.execute(this.ignoreBlocks, this.path.concat(index));
    this.a.gotoParent();
    this.b.gotoParent();
    if (result) {
      const [children, childVariables] = result;
      this.variablePaths = this.variablePaths.concat(childVariables);
      this.nodes.push({
        fieldName: this.a.currentFieldName() || undefined,
        type: this.a.nodeType,
        children,
      });
    } else {
      this.recordMissMatch(index);
    }
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
