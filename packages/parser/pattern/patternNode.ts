import AstNode from "../ast/node";

export default abstract class PatternNode {
  public readonly fieldName: string | undefined;
  private _parent: PatternNode | null | undefined;

  constructor(
    public readonly type: string,
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

  hasChildren(): boolean {
    return this.children.length > 0;
  }

  hasNextSibling(): boolean {
    if (!this._parent) {
      return false;
    }
    const childIndex = this._parent.children.findIndex(
      (childNode) => childNode === this
    );
    return !!this._parent.children[childIndex + 1];
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

  abstract matches(astNode: AstNode): boolean;
}
