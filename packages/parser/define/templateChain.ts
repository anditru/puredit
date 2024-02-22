import AstCursor from "../ast/cursor";
import RawTemplate from "./rawTemplate";
import { Context } from "../match/types";
import TemplateParameter from "./templateParameter";
import PatternNode from "../pattern/nodes/patternNode";
import ChainNode from "../pattern/nodes/chainNode";
import { Language } from "@puredit/language-config";

export default class TemplateChain extends TemplateParameter {
  static readonly CODE_STRING_PREFIX = "__template_chain_";

  constructor(
    public readonly name: string,
    public readonly startPattern: RawTemplate,
    public readonly linkPatterns: RawTemplate[],
    public readonly context: Context = {}
  ) {
    super();
  }

  toCodeString(): string {
    if (this._id === undefined) {
      this._id = TemplateParameter.issueId();
    }
    return TemplateChain.CODE_STRING_PREFIX + this._id.toString();
  }

  getCodeStringForChainStart(): string {
    return this.startPattern.toCodeString();
  }

  getCodeStringsForChainLinks(): string[] {
    return this.linkPatterns.map((pattern) => pattern.toCodeString());
  }

  toPatternNode(cursor: AstCursor, language: Language): PatternNode {
    return new ChainNode(language, cursor.currentNode.text, cursor.currentFieldName, this);
  }

  toDraftString(language: Language): string {
    const startDraftString = this.startPattern.toDraftString(language);
    const linkDraftPatterns = this.linkPatterns
      .slice(0, 2)
      .map((linkPattern) => linkPattern.toDraftString(language));
    return [startDraftString, ...linkDraftPatterns].join(".");
  }
}
