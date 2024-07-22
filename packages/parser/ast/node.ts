import type { SyntaxNode } from "web-tree-sitter";
import AstCursor from "./cursor";

/**
 * @class
 * Wrapper around the SyntaxNode class of Tree-sitter.
 */
export default class AstNode {
  private _parent: AstNode | null = null;

  constructor(private readonly syntaxNode: SyntaxNode) {
    if (syntaxNode.parent) {
      this._parent = new AstNode(syntaxNode.parent);
    }
  }

  isKeyword(): boolean {
    return !this.syntaxNode.isNamed();
  }

  isErrorToken(): boolean {
    return this.syntaxNode.type === "ERROR";
  }

  hasChildren(): boolean {
    return this.syntaxNode.childCount > 0;
  }

  getChildIndex(): number {
    if (!this.syntaxNode.parent) {
      throw new Error("Node does not have a parent");
    }
    return this.syntaxNode.parent.children.findIndex(
      (childNode) => childNode.id === this.syntaxNode.id
    );
  }

  walk(): AstCursor {
    return new AstCursor(this.syntaxNode.walk());
  }

  cutOff(): AstNode {
    this._parent = null;
    return this;
  }

  get parent(): AstNode | null {
    return this._parent;
  }

  get children() {
    return this.syntaxNode.children.map((child) => new AstNode(child));
  }

  get type() {
    return this.syntaxNode.type;
  }

  get cleanNodeType() {
    if (this.syntaxNode.type === "identifier" && this.syntaxNode.text.startsWith("__empty_")) {
      return this.syntaxNode.text.slice("__empty_".length);
    }
    return this.syntaxNode.type;
  }

  get text() {
    return this.syntaxNode.text;
  }

  get startIndex() {
    return this.syntaxNode.startIndex;
  }

  get endIndex() {
    return this.syntaxNode.endIndex;
  }
}
