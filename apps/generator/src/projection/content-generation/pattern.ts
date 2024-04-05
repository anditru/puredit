import Cursor from "@puredit/parser/cursor/cursor";
import type { Point, SyntaxNode } from "web-tree-sitter";

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

export class PatternCursor extends Cursor {
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

  private runningTransaction = false;
  private runningRollback = false;
  private operationLog: TransactionOperation[] = [];

  constructor(private node: PatternNode) {
    super();
  }

  protected beginTransaction() {
    this.runningTransaction = true;
    this.operationLog = [];
  }

  protected commitTransaction() {
    this.operationLog = [];
    this.runningTransaction = false;
  }

  protected rollbackTransaction() {
    this.runningRollback = true;

    while (this.operationLog.length > 0) {
      const operation = this.operationLog.pop();
      if (operation === TransactionOperation.GOTO_FIRST_CHILD) {
        this.goToParent();
      } else if (operation === TransactionOperation.GOTO_PARENT) {
        this.goToFirstChild();
      }
    }
    this.runningRollback = false;
    this.runningTransaction = false;
  }

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
      if (this.runningTransaction && !this.runningRollback) {
        this.operationLog.push(TransactionOperation.GOTO_PARENT);
      }
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
      if (this.runningTransaction && !this.runningRollback) {
        this.operationLog.push(TransactionOperation.GOTO_FIRST_CHILD);
      }
      return true;
    }
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

  goToSiblingWithIndex(index: number): boolean {
    for (let i = 0; i < index; i++) {
      if (!this.goToNextSibling()) {
        return false;
      }
    }
    return true;
  }
}

enum TransactionOperation {
  GOTO_PARENT,
  GOTO_FIRST_CHILD,
}
