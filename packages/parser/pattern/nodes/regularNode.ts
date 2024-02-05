import AstNode from "../../ast/node";
import { Target } from "../../treeSitterParser";
import PatternNode from "./patternNode";

export default class RegularNode extends PatternNode {
  constructor(
    language: Target,
    type: string,
    text: string,
    fieldName: string | null,
    children: PatternNode[] = []
  ) {
    super(language, type, text, fieldName, children);
  }

  getMatchedTypes(): string[] {
    return [this.type];
  }

  matches(astNode: AstNode): boolean {
    if (astNode.cleanNodeType !== this.type) {
      return false;
    }
    if (this.hasChildren()) {
      return true;
    } else {
      return astNode.text === this.text;
    }
  }
}

export class RegularNodeBuilder {
  private _language: Target | undefined;
  private _type: string | undefined;
  private _text: string | undefined;
  private _fieldName: string | null | undefined;
  private _children: PatternNode[] = [];

  setLanguage(language: Target): RegularNodeBuilder {
    this._language = language;
    return this;
  }

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

  buildAndSetParentOnChildren() {
    const regularNode = new RegularNode(
      this._language!,
      this._type!,
      this._text!,
      this._fieldName!,
      this._children
    );
    this._children.forEach((child) => (child.parent = regularNode));
    return regularNode;
  }

  buildsParentOfBlockNode() {
    return (
      ["block", "expression_statement"].includes(this._type!) &&
      this._children[0].type === "TemplateBlock"
    );
  }

  buildsParentOfAggregationNode() {
    return ["argument_list"].includes(this._type!) && this._children[0]?.type === "AggregationNode";
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
