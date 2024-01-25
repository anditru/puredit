import type { TreeCursor } from "web-tree-sitter";

export class AstCursor {
  constructor(private treeCursor: TreeCursor) {}

  goToParent(): boolean {
    return this.treeCursor.gotoParent();
  }

  goToFirstChild(): boolean {
    return this.treeCursor.gotoFirstChild();
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

  skipKeywords(): [boolean, Keyword | undefined] {
    let lastKeyword: Keyword | undefined;
    while (this.isKeyword()) {
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

  isKeyword(): boolean {
    return !this.treeCursor.nodeIsNamed;
  }

  shouldTreatAsAtomicNode(): boolean {
    // String literals may have children, in particular escape sequences.
    // To keep it simple, we treat string literals as atomic nodes.
    return this.treeCursor.nodeType === "string";
  }

  get currentNode() {
    return this.treeCursor.currentNode();
  }

  get currentFieldName() {
    return this.treeCursor.currentFieldName();
  }

  public get nodeType() {
    return this.treeCursor.nodeType;
  }

  public get cleanNodeType() {
    if (
      this.treeCursor.nodeType === "identifier" &&
      this.treeCursor.nodeText.startsWith("__empty_")
    ) {
      return this.treeCursor.nodeText.slice("__empty_".length);
    }
    return this.treeCursor.nodeType;
  }

  public get startIndex() {
    return this.treeCursor.startIndex;
  }

  public get endIndex() {
    return this.treeCursor.endIndex;
  }

  public get nodeText() {
    return this.treeCursor.nodeText;
  }
}

export interface Keyword {
  type: string;
  pos: number;
}
