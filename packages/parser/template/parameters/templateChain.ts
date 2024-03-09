import AstCursor from "../../ast/cursor";
import Template from "../template";
import TemplateParameter from "./templateParameter";
import PatternNode from "../../pattern/nodes/patternNode";
import ChainNode from "../../pattern/nodes/chainNode";
import { Language } from "@puredit/language-config";
import { ContextVariableMap } from "@puredit/projections";

export default class TemplateChain extends TemplateParameter {
  static readonly CODE_STRING_PREFIX = "__template_chain_";

  constructor(
    public readonly name: string,
    public readonly startPattern: Template,
    public readonly linkPatterns: Template[],
    public readonly contextVariables: ContextVariableMap
  ) {
    super();
  }

  toCodeString(): string {
    return TemplateChain.CODE_STRING_PREFIX + this.id.toString();
  }

  toPatternNode(cursor: AstCursor, language: Language): PatternNode {
    return new ChainNode(language, cursor.currentNode.text, cursor.currentFieldName, this);
  }

  toDraftString(): string {
    const startDraftString = this.startPattern.toDraftString();
    const linkDraftPatterns = this.linkPatterns
      .slice(0, 2)
      .map((linkPattern) => linkPattern.toDraftString());
    return [startDraftString, ...linkDraftPatterns].join(".");
  }
}
