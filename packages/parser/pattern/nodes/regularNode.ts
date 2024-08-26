import { Language } from "@puredit/language-config";
import AstCursor from "../../ast/cursor";
import PatternNode from "./patternNode";
import { ContextVariableMap } from "@puredit/projections";
import { loadBlockNodeTypeFor } from "@puredit/language-config/load";

/**
 * @class
 * Represents a syntax node that appears in a pattern "as it is".
 */
export default class RegularNode extends PatternNode {
  constructor(
    language: Language,
    type: string,
    fieldName: string | undefined,
    text: string,
    startIndex: number,
    endIndex: number,
    children: PatternNode[] = []
  ) {
    super(language, type, fieldName, text, startIndex, endIndex, children);
  }

  getMatchedTypes(): string[] {
    return [this.type];
  }

  matches(astCursor: AstCursor, contextVariables?: ContextVariableMap): boolean {
    if (astCursor.currentFieldName !== this.fieldName) {
      return false;
    }
    const astNode = astCursor.currentNode;
    if (astNode.cleanNodeType !== this.type) {
      return false;
    }
    return (this.hasChildren() && astNode.hasChildren()) || this.text === astNode.text;
  }

  toDraftString(): string {
    if (!this.children.length) {
      return this.text;
    } else {
      let prevEndIndex: number | null = null;
      return this.children.reduce((prev: string, current: PatternNode) => {
        const text = current.toDraftString();
        let prefix = "";
        const postfix = "";
        if (prevEndIndex != null && current.startIndex > prevEndIndex) {
          prefix = " ";
        }
        if (this.type === loadBlockNodeTypeFor(this.language)) {
          prefix = "\n    ";
        }
        prevEndIndex = current.endIndex;
        return prev + prefix + text + postfix;
      }, "");
    }
  }
}

export class RegularNodeBuilder {
  private _language!: Language;
  private _type!: string;
  private _text!: string;
  private _startIndex!: number;
  private _endIndex!: number;
  private _fieldName!: string | undefined;
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

  setStartIndex(startIndex: number): RegularNodeBuilder {
    this._startIndex = startIndex;
    return this;
  }

  setEndIndex(endIndex: number): RegularNodeBuilder {
    this._endIndex = endIndex;
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
      this._language,
      this._type,
      this._fieldName,
      this._text,
      this._startIndex,
      this._endIndex,
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
