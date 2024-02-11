import AstCursor from "../../ast/cursor";
import { Context } from "../../match/types";
import { Target } from "../../treeSitterParser";

export default abstract class PatternNode {
  public fieldName: string | undefined;
  private _parent: PatternNode | null | undefined;

  constructor(
    public readonly language: Target,
    public type: string,
    public readonly text: string,
    fieldName: string | null,
    public readonly children: PatternNode[] = []
  ) {
    if (!fieldName) {
      this.fieldName = undefined;
    } else {
      this.fieldName = fieldName;
    }
  }

  isTopNode(): boolean {
    return this.type === "program" || this.type === "module";
  }

  isLeafNode(): boolean {
    return this.children.length === 0;
  }

  hasParent(): boolean {
    return !!this.parent;
  }

  hasChildren(): boolean {
    return this.children.length > 0;
  }

  hasText(): boolean {
    return !!this.text;
  }

  hasNextSibling(): boolean {
    const childIndex = this.getChildIndex();
    return !!this._parent!.children[childIndex + 1];
  }

  hasPreviousSibling(): boolean {
    const childIndex = this.getChildIndex();
    return !!this._parent!.children[childIndex - 1];
  }

  getChildIndex(): number {
    if (!this._parent) {
      throw new Error("Node does not have a parent");
    }
    return this._parent.children.findIndex((childNode) => childNode === this);
  }

  cutOff(): PatternNode {
    this._parent = null;
    return this;
  }

  get parent(): PatternNode | null | undefined {
    return this._parent;
  }

  set parent(parent: PatternNode) {
    if (this._parent) {
      throw new Error("Parent is already set");
    }
    this._parent = parent;
  }

  abstract matches(astCursor: AstCursor, context?: Context): boolean;
  abstract getMatchedTypes(): string[];
}
