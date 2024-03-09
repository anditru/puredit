import type { SyntaxNode } from "web-tree-sitter";
import AstCursor from "./cursor";

export default class AstNode {
  constructor(private readonly syntaxNode: SyntaxNode) {}

  isKeyword(): boolean {
    return !this.syntaxNode.isNamed();
  }

  isErrorToken(): boolean {
    return this.syntaxNode.type === "ERROR";
  }

  hasChildren(): boolean {
    return this.syntaxNode.childCount > 0;
  }

  walk(): AstCursor {
    return new AstCursor(this.syntaxNode.walk());
  }

  get parent(): AstNode | null {
    if (this.syntaxNode.parent) {
      return new AstNode(this.syntaxNode.parent);
    } else {
      return null;
    }
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

  public get text() {
    return this.syntaxNode.text;
  }

  get startIndex() {
    return this.syntaxNode.startIndex;
  }

  get endIndex() {
    return this.syntaxNode.endIndex;
  }
}
