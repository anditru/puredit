import AstNode from "../ast/node";
import PatternNode from "./patternNode";

export default class RegularNode extends PatternNode {
  constructor(
    public readonly type: string,
    public readonly text: string,
    fieldName: string | null,
    children: PatternNode[] = []
  ) {
    super(type, text, fieldName, children);
  }

  matches(astNode: AstNode): boolean {
    return false;
  }
}

export class RegularNodeBuilder {
  private _type: string | undefined;
  private _text: string | undefined;
  private _fieldName: string | null | undefined;
  private _children: PatternNode[] = [];

  setType(type: string): RegularNodeBuilder {
    this._type = type;
    return this;
  }

  setText(text: string): RegularNodeBuilder {
    this._text = text;
    return this;
  }

  setFieldName(fieldName: string | null): RegularNodeBuilder {
    this._fieldName = fieldName;
    return this;
  }

  setChildren(nodes: PatternNode[]): RegularNodeBuilder {
    this._children = nodes;
    return this;
  }

  build() {
    return new RegularNode(
      this._type!,
      this._text!,
      this._fieldName!,
      this._children
    );
  }

  get fieldName() {
    return this._fieldName;
  }

  get type() {
    return this._type;
  }

  get children() {
    return this._children;
  }
}
