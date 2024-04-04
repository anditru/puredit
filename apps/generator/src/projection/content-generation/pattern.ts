import type { TreeCursor, Point, SyntaxNode } from "web-tree-sitter";

export interface PatternNode {
  variable?: true;
  variableName?: string;
  wildcard?: true;
  fieldName?: string;
  type: string;
  children?: PatternNode[];
  text?: string;
  startIndex?: number;
}

export class PatternCursor implements Cursor {
  nodeTypeId = 0;
  nodeId = 0;
  nodeIsNamed = true;
  nodeIsMissing = false;
  startPosition: Point = { row: 0, column: 0 };
  endPosition: Point = { row: 0, column: 0 };
  startIndex = 0;
  endIndex = 0;

  private parents: PatternNode[] = [];
  private childIndex: number[] = [];
  constructor(private node: PatternNode) {}

  get currentNode(): SyntaxNode {
    return this.node as any;
  }

  get currentFieldName(): string {
    return this.node.fieldName || "";
  }

  goToParent(): boolean {
    if (this.parents.length) {
      this.node = this.parents.pop();
      this.childIndex.pop();
      return true;
    }
    return false;
  }

  goToFirstChild(): boolean {
    if (this.currentNode.type === "string") {
      return false;
    }
    if (this.node.children?.length) {
      this.childIndex.push(0);
      this.parents.push(this.node);
      this.node = this.node.children[0];
      return true;
    }
    return false;
  }

  goToFirstChildForIndex(): boolean {
    return false;
  }

  goToNextSibling(): boolean {
    if (this.childIndex.length) {
      const index = this.childIndex[this.childIndex.length - 1] + 1;
      const parent = this.parents[this.parents.length - 1];
      if (index < parent.children.length) {
        this.node = parent.children[index];
        this.childIndex[this.childIndex.length - 1] = index;
        return true;
      }
    }
    return false;
  }
}

export interface Cursor {
  get currentNode(): SyntaxNode;
  get currentFieldName(): string;

  goToParent(): boolean;
  goToFirstChild(): boolean;
  goToFirstChildForIndex(): boolean;
  goToNextSibling(): boolean;
}
