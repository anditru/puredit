import type { TreeCursor } from "web-tree-sitter";
import TemplateAggregation from "./define/templateAggregation";
import TemplateBlock from "./define/templateBlock";
import TemplateContextVariable from "./define/templateContextVariable";
import TemplateArgument from "./define/templateArgument";

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

  isTemplateParameterNode(): boolean {
    const nodeText = this.treeCursor.nodeText;
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
    const nodeText = this.treeCursor.nodeText;
    return parseInt(nodeText.split("_").pop()!);
  }

  hasChildren(): boolean {
    if (this.goToFirstChild()) {
      this.goToParent();
      return true;
    } else {
      return false;
    }
  }

  /**
   * String literals may have children, in particular escape sequences.
   * To keep it simple, we treat string literals as atomic nodes.
   * @returns boolean
   */
  shouldTreatAsAtomicNode(): boolean {
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
