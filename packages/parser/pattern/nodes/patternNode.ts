import { ContextVariableMap } from "@puredit/projections";
import AstCursor from "../../ast/cursor";
import { Pattern } from "../..";
import { Language } from "@puredit/language-config";

export default abstract class PatternNode {
  private _parent: PatternNode | null | undefined;

  protected owningPattern: Pattern | undefined;

  public readonly language: Language;
  public readonly type: string;
  public fieldName: string | undefined;
  public readonly text: string;
  public readonly children: PatternNode[];

  constructor(
    language: Language,
    type: string,
    fieldName: string | undefined,
    text: string,
    children: PatternNode[] = []
  ) {
    this.language = language;
    this.type = type;
    if (!fieldName) {
      this.fieldName = undefined;
    } else {
      this.fieldName = fieldName;
    }
    this.text = text;
    this.children = children;
  }

  assignToPattern(pattern: Pattern) {
    this.owningPattern = pattern;
    this.children.forEach((child) => child.assignToPattern(pattern));
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

  insertChild(node: PatternNode, index: number) {
    node.parent = this;
    this.children[index] = node;
  }

  get parent(): PatternNode | null | undefined {
    return this._parent;
  }

  set parent(parent: PatternNode) {
    this._parent = parent;
  }

  abstract matches(astCursor: AstCursor, contextVariables?: ContextVariableMap): boolean;
  abstract getMatchedTypes(): string[];
  abstract toDraftString(): string;
}
