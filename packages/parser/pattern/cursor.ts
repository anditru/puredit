import Pattern from "./pattern";
import PatternNode from "./patternNode";

export default class PatternCursor {
  private _currentNode: PatternNode;

  constructor(private readonly pattern: Pattern) {
    this._currentNode = this.pattern.rootNode;
  }

  goToFirstChild(): boolean {
    if (!this._currentNode.hasChildren()) {
      return false;
    }
    this._currentNode = this._currentNode.children[0];
    return true;
  }

  goToParent(): boolean {
    if (!this._currentNode.parent) {
      return false;
    }
    this._currentNode = this._currentNode.parent;
    return true;
  }

  goToNextSibling(): boolean {
    if (!this._currentNode.hasNextSibling()) {
      return false;
    }
    const _currentNodeIndex = this._currentNode.parent!.children.findIndex(
      (childNode) => childNode === this._currentNode
    );
    this._currentNode =
      this._currentNode.parent!.children[_currentNodeIndex + 1];
    return true;
  }

  get currentNode() {
    return this._currentNode;
  }
}
