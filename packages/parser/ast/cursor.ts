import type { TreeCursor } from "web-tree-sitter";
import AstNode from "./node";
import Cursor from "../cursor/cursor";

/**
 * @class
 * Wrapper class around the Tree-sitter parser. It extends the Tree-sitter parsers
 * with more complex operations such as goToChildWithFieldName.
 */
export default class AstCursor extends Cursor {
  private runningTransaction = false;
  private runningRollback = false;
  private operationLog: TransactionOperation[] = [];
  private _changedFieldName: string | undefined;
  private _currentPath: number[] = [];

  constructor(private treeCursor: TreeCursor) {
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

  goToParent(): boolean {
    if (this.treeCursor.gotoParent()) {
      if (this.runningTransaction && !this.runningRollback) {
        this.operationLog.push(TransactionOperation.GOTO_PARENT);
      }
      this._currentPath.pop();
      this._changedFieldName = undefined;
      return true;
    } else {
      return false;
    }
  }

  goToFirstChild(): boolean {
    if (this.currentNode.type === "string") {
      return false;
    }
    if (this.treeCursor.gotoFirstChild()) {
      if (this.runningTransaction && !this.runningRollback) {
        this.operationLog.push(TransactionOperation.GOTO_FIRST_CHILD);
      }
      this._currentPath.push(0);
      this._changedFieldName = undefined;
      return true;
    } else {
      return false;
    }
  }

  goToFirstNonKeywordChildAndGetLastKeyword(): boolean | Keyword | undefined {
    this.goToFirstChild();
    const [hasSibling, lastKeyword] = this.skipKeywordsAndGetLast();
    if (!hasSibling) {
      return false;
    } else {
      return lastKeyword;
    }
  }

  goToChildWithFieldName(fieldName: string) {
    this.beginTransaction();
    if (this.goToFirstChild()) {
      while (this.currentFieldName !== fieldName) {
        if (!this.goToNextSibling()) {
          this.rollbackTransaction();
          return false;
        }
      }
      this.commitTransaction();
      return true;
    } else {
      this.rollbackTransaction();
      return false;
    }
  }

  goToFirstChildForIndex(index: number): boolean {
    return this.treeCursor.gotoFirstChildForIndex(index);
  }

  goToNextSibling(): boolean {
    /* The underlying cursor by web-tree-sitter does currently not support gotoPreviousSibling.
     * Therefore transactions starting with gotoNextSibling cannot be rolled back correctly */
    if (this.runningTransaction && this.operationLog.length === 0) {
      throw new Error("Transaction on AST Cursor cannot start with goToNextSibling");
    }
    if (this.treeCursor.gotoNextSibling()) {
      this._currentPath.push(this._currentPath.pop()! + 1);
      this._changedFieldName = undefined;
      return true;
    } else {
      return false;
    }
  }

  goToSiblingWithIndex(index: number): boolean {
    for (let i = 0; i < index; i++) {
      if (!this.goToNextSibling()) {
        return false;
      }
    }
    return true;
  }

  goToExpression(): boolean {
    do {
      if (this.treeCursor.nodeType === "expression_statement") {
        this.treeCursor.gotoFirstChild();
        return true;
      }
    } while (this.goToNextNode());
    return false;
  }

  goToNextNode(): boolean {
    return (
      this.treeCursor.gotoFirstChild() ||
      this.treeCursor.gotoNextSibling() ||
      (this.treeCursor.gotoParent() && this.treeCursor.gotoNextSibling())
    );
  }

  skipKeywordsAndGetLast(): [boolean, Keyword | undefined] {
    let lastKeyword: Keyword | undefined;
    while (!this.treeCursor.currentNode().isNamed()) {
      lastKeyword = {
        type: this.treeCursor.nodeType,
        pos: this.treeCursor.startIndex,
      };
      if (!this.treeCursor.gotoNextSibling()) {
        return [false, lastKeyword];
      }
    }
    return [true, lastKeyword];
  }

  get nodeIsNamed() {
    return !this.currentNode.isKeyword();
  }

  get currentPath() {
    return [...this._currentPath];
  }

  get currentNode() {
    return new AstNode(this.treeCursor.currentNode());
  }

  get currentFieldName(): string | undefined {
    return this._changedFieldName || this.treeCursor.currentFieldName() || undefined;
  }

  set currentFieldName(fieldName: string | undefined) {
    this._changedFieldName = fieldName;
  }

  get startIndex() {
    return this.treeCursor.startIndex;
  }

  get endIndex() {
    return this.treeCursor.endIndex;
  }
}

export interface Keyword {
  type: string;
  pos: number;
}

enum TransactionOperation {
  GOTO_PARENT,
  GOTO_FIRST_CHILD,
}
