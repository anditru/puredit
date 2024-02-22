import AstCursor from "../../ast/cursor";
import { Language } from "@puredit/language-config";
import { Context } from "../../match/types";
import PatternNode from "./patternNode";

export default class RegularNode extends PatternNode {
  constructor(
    language: Language,
    type: string,
    text: string,
    fieldName: string | undefined,
    children: PatternNode[] = []
  ) {
    super(language, type, text, fieldName, children);
  }

  getMatchedTypes(): string[] {
    return [this.type];
  }

  matches(astCursor: AstCursor, context?: Context): boolean {
    if (astCursor.currentFieldName !== this.fieldName) {
      return false;
    }
    const astNode = astCursor.currentNode;
    if (astNode.cleanNodeType !== this.type) {
      return false;
    }
    return (this.hasChildren() && astNode.hasChildren()) || this.text === astNode.text;
  }
}

export class RegularNodeBuilder {
  private _language: Language | undefined;
  private _type: string | undefined;
  private _text: string | undefined;
  private _fieldName: string | null | undefined;
  private _children: PatternNode[] = [];

  setLanguage(language: Language): RegularNodeBuilder {
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

  setFieldName(fieldName: string | undefined): RegularNodeBuilder {
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
      this._children[0].type === "BlockNode"
    );
  }

  buildsParentOfAggregationNode() {
    return (
      ["argument_list"].includes(this._type!) &&
      this._children[0]?.type === "TemporaryAggregationNode"
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
