import { SyntaxNode } from "web-tree-sitter";
import TemplateArgument from "../define/templateArgument";
import TemplateAggregation from "../define/templateAggregation";
import TemplateBlock from "../define/templateBlock";
import TemplateContextVariable from "../define/templateContextVariable";
import AstCursor from "./cursor";

export default class AstNode {
  constructor(private readonly syntaxNode: SyntaxNode) {}

  isKeyword(): boolean {
    return !this.syntaxNode.isNamed();
  }

  isErrorToken(): boolean {
    return this.syntaxNode.type === "ERROR";
  }

  isTemplateParameterNode(): boolean {
    const nodeText = this.syntaxNode.text;
    const TemplateParameterTypes = [
      TemplateArgument,
      TemplateAggregation,
      TemplateBlock,
      TemplateContextVariable,
    ];
    for (const TemplateParameterType of TemplateParameterTypes) {
      if (nodeText.startsWith(TemplateParameterType.CODE_STRING_PREFIX)) {
        return true;
      }
    }
    return false;
  }

  getTemplateParameterId(): number {
    if (!this.isTemplateParameterNode()) {
      new Error("Current node is no TemplateParameterNode");
    }
    const nodeText = this.syntaxNode.text;
    return parseInt(nodeText.split("_").pop()!);
  }

  hasChildren(): boolean {
    return this.syntaxNode.childCount > 0;
  }

  /**
   * String literals may have children, in particular escape sequences.
   * To keep it simple, we treat string literals as atomic nodes.
   * @returns boolean
   */
  shouldTreatAsAtomicNode(): boolean {
    return this.syntaxNode.type === "string";
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
