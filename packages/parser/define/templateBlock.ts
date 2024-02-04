import AstCursor from "../ast/cursor";
import { Target } from "../treeSitterParser";
import { Context } from "../match/types";
import TemplateParameter from "./templateParameter";
import PatternNode from "../pattern/nodes/patternNode";
import BlockNode from "../pattern/nodes/blockNode";

export default class TemplateBlock extends TemplateParameter {
  static readonly CODE_STRING_PREFIX = "__template_block_";

  constructor(public readonly context: Context) {
    super();
  }

  toCodeString(): string {
    if (this._id === undefined) {
      this._id = TemplateParameter.issueId();
    }
    return TemplateBlock.CODE_STRING_PREFIX + this._id.toString();
  }

  toPatternNode(cursor: AstCursor, language: Target): PatternNode {
    return new BlockNode(language, cursor.currentNode.text, cursor.currentFieldName, this);
  }
}