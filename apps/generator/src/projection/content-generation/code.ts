import type { Tree, TreeCursor } from "web-tree-sitter";
import { PatternCursor, PatternNode } from "./pattern";
import { Language } from "./common";
import { loadBlocksConfigFor } from "@puredit/language-config";
import { getUndeclaredVarSearchFor } from "./context-var-detection/factory";
import AstNode from "@puredit/parser/ast/node";
import { BlockVariableMap, Path } from "./context-var-detection/blockVariableMap";
import AstCursor from "@puredit/parser/ast/cursor";

export function scanCode(samples: Tree[], language: Language, ignoreBlocks: boolean) {
  let variablePaths: Path[] = [];
  let nodes: PatternNode[] = [];
  let cursor: AstCursor | PatternCursor = new AstCursor(samples[0].walk());
  for (let i = 1; i < samples.length; i++) {
    const nodeComparison = new NodeComparison(cursor, new AstCursor(samples[i].walk()), language);
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

  constructor(
    private a: AstCursor | PatternCursor,
    private b: AstCursor | PatternCursor,
    private language: Language
  ) {
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

      const hasSiblingA = this.a.goToNextSibling();
      const hasSiblingB = this.b.goToNextSibling();
      if (hasSiblingA !== hasSiblingB) {
        return null; // mismatch (parent)
      }
      hasSibling = hasSiblingA && hasSiblingB;
    }
    return [this.nodes, this.variablePaths];
  }

  private parentMissMatch(): boolean {
    return this.a.currentFieldName !== this.b.currentFieldName;
  }

  private typeMissMatch(): boolean {
    return this.a.currentNode.type !== this.b.currentNode.type;
  }

  private atLeastOneNodeIsKeyword(): boolean {
    return !this.a.nodeIsNamed || !this.b.nodeIsNamed;
  }

  private recordMissMatchWithWildcard(index: number) {
    this.variablePaths.push(this.path.concat(index));
    this.nodes.push({
      variable: true,
      type: "*",
      fieldName: this.a.currentFieldName || undefined,
    });
  }

  private nodesAreBlock(): boolean {
    return (
      this.a.currentNode.type === this.blockNodeType &&
      this.b.currentNode.type === this.blockNodeType
    );
  }

  private recordMissMatch(index: number) {
    this.variablePaths.push(this.path.concat(index));
    this.nodes.push({
      variable: true,
      fieldName: this.a.currentFieldName || undefined,
      type: this.a.currentNode.type,
    });
  }

  private compareChildren(index: number) {
    const hasChildrenA = this.a.goToFirstChild();
    const hasChildrenB = this.b.goToFirstChild();
    if (hasChildrenA !== hasChildrenB) {
      if (hasChildrenA) {
        this.a.goToParent();
      }
      if (hasChildrenB) {
        this.b.goToParent();
      }
      this.recordMissMatch(index);
    } else if (hasChildrenA && hasChildrenB) {
      this.executeChildNodeComparison(index);
    } else if (this.a.currentNode.text !== this.b.currentNode.text) {
      this.recordMissMatch(index);
    } else {
      this.nodes.push({
        fieldName: this.a.currentFieldName || undefined,
        type: this.a.currentNode.type,
        text: this.a.currentNode.text,
      });
    }
  }

  private executeChildNodeComparison(index: number) {
    const childNodeComparison = new NodeComparison(this.a, this.b, this.language);
    const result = childNodeComparison.execute(this.ignoreBlocks, this.path.concat(index));
    this.a.goToParent();
    this.b.goToParent();
    if (result) {
      const [children, childVariables] = result;
      this.variablePaths = this.variablePaths.concat(childVariables);
      this.nodes.push({
        fieldName: this.a.currentFieldName || undefined,
        type: this.a.currentNode.type,
        children,
      });
    } else {
      this.recordMissMatch(index);
    }
  }
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
