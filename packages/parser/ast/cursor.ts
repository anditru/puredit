import type { TreeCursor } from "web-tree-sitter";
import AstNode from "./node";

export default class AstCursor {
  constructor(private treeCursor: TreeCursor) {}

  goToParent(): boolean {
    return this.treeCursor.gotoParent();
  }

  goToFirstChild(): boolean {
    return this.treeCursor.gotoFirstChild();
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

  goToFirstChildForIndex(index: number): boolean {
    return this.treeCursor.gotoFirstChildForIndex(index);
  }

  goToNextSibling(): boolean {
    return this.treeCursor.gotoNextSibling();
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

  get currentNode() {
    return new AstNode(this.treeCursor.currentNode());
  }

  get currentFieldName() {
    return this.treeCursor.currentFieldName();
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
