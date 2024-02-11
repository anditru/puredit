import TreePath from "./treePath";

export default abstract class Cursor {
  follow(path: TreePath): boolean {
    this.beginTransaction();
    for (const step of path.steps) {
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

  reverseFollow(path: TreePath): boolean {
    this.beginTransaction();
    for (const _ of path.steps) {
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

  // TODO: Implement transaction management here, once web-tree-sitter supports gotoPreviousSibling
  protected abstract beginTransaction(): void;
  protected abstract commitTransaction(): void;
  protected abstract rollbackTransaction(): void;

  abstract goToParent(): boolean;
  abstract goToFirstChild(): boolean;
  abstract goToSiblingWithIndex(index: number): boolean;
}
