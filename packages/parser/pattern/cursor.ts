import BasePattern from "./basePattern";
import PatternNode from "./nodes/patternNode";
import Pattern from "./pattern";
import PatternDecorator from "./decorators/patternDecorator";
import TreePath from "../cursor/treePath";
import Cursor from "../cursor/cursor";
import ReferencePattern from "./referencePattern";

/**
 * @class
 * Extension of the base cursor to operate on syntax tree patterns.
 * API is analogous to the AstCursor.
 */
export default class PatternCursor extends Cursor {
  private _currentNode: PatternNode;

  private runningTransaction = false;
  private runningRollback = false;
  private operationLog: TransactionOperation[] = [];

  constructor(source: Pattern | PatternNode | PatternDecorator | ReferencePattern) {
    super();
    if (
      source instanceof BasePattern ||
      source instanceof PatternDecorator ||
      source instanceof ReferencePattern
    ) {
      this._currentNode = source.rootNode;
    } else if (source instanceof PatternNode) {
      this._currentNode = source;
    } else {
      throw new Error("Source for PatternCursor must be eiter PatternNode or Pattern");
    }
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
      } else if (operation === TransactionOperation.GOTO_NEXT_SIBLING) {
        this.goToPreviousSibling();
      } else if (operation === TransactionOperation.GOTO_PARENT) {
        this.goToFirstChild();
      } else if (operation === TransactionOperation.GOTO_PREVIOUS_SIBLING) {
        this.goToNextSibling();
      }
    }

    this.runningRollback = false;
    this.runningTransaction = false;
  }

  follow(path: TreePath | number[]): boolean {
    this.beginTransaction();
    const steps: number[] = path instanceof TreePath ? path.steps : path;
    for (const step of steps) {
      if (this.goToFirstChild()) {
        if (!this.goToSiblingWithIndex(step)) {
          this.rollbackTransaction();
          return false;
        }
      } else {
        this.rollbackTransaction();
        return false;
      }
    }
    this.commitTransaction();
    return true;
  }

  reverseFollow(path: TreePath | number[]): boolean {
    this.beginTransaction();
    const steps: number[] = path instanceof TreePath ? path.steps : path;
    for (const _ of steps) {
      if (this.goToParent()) {
        continue;
      } else {
        this.rollbackTransaction();
        return false;
      }
    }
    this.commitTransaction();
    return true;
  }

  goToSiblingWithIndex(index: number): boolean {
    for (let i = 0; i < index; i++) {
      if (!this.goToNextSibling()) {
        return false;
      }
    }
    return true;
  }

  goToFirstChild(): boolean {
    if (!this._currentNode.hasChildren()) {
      return false;
    }
    this._currentNode = this._currentNode.children[0];
    if (this.runningTransaction && !this.runningRollback) {
      this.operationLog.push(TransactionOperation.GOTO_FIRST_CHILD);
    }
    return true;
  }

  goToParent(): boolean {
    if (!this._currentNode.parent) {
      return false;
    }
    this._currentNode = this._currentNode.parent;
    if (this.runningTransaction && !this.runningRollback) {
      this.operationLog.push(TransactionOperation.GOTO_PARENT);
    }
    return true;
  }

  goToNextSibling(): boolean {
    if (!this._currentNode.hasNextSibling()) {
      return false;
    }

    const currentChildNodeIndex = this.getCurrentChildNodeIndex();
    this._currentNode = this._currentNode.parent!.children[currentChildNodeIndex + 1];

    if (this.runningTransaction && !this.runningRollback) {
      this.operationLog.push(TransactionOperation.GOTO_NEXT_SIBLING);
    }
    return true;
  }

  private getCurrentChildNodeIndex(): number {
    return this._currentNode.parent!.children.findIndex(
      (childNode) => childNode === this._currentNode
    );
  }

  goToPreviousSibling(): boolean {
    if (!this._currentNode.hasPreviousSibling()) {
      return false;
    }

    const currentChildNodeIndex = this.getCurrentChildNodeIndex();
    this._currentNode = this._currentNode.parent!.children[currentChildNodeIndex - 1];

    if (this.runningTransaction && !this.runningRollback) {
      this.operationLog.push(TransactionOperation.GOTO_PREVIOUS_SIBLING);
    }
    return true;
  }

  get currentNode() {
    return this._currentNode;
  }
}

enum TransactionOperation {
  GOTO_PARENT,
  GOTO_FIRST_CHILD,
  GOTO_NEXT_SIBLING,
  GOTO_PREVIOUS_SIBLING,
}
