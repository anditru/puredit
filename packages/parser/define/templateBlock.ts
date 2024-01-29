import AstCursor from "../ast/cursor";
import { Target } from "../treeSitterParser";
import { Context } from "../types";
import TemplateParameter from "./templateParameter";
import PatternNode from "../pattern/patternNode";
import BlockNode from "../pattern/blockNode";

export default class TemplateBlock extends TemplateParameter {
  static readonly CODE_STRING_PREFIX = "__template_block_";

  constructor(
    public readonly context: Context,
    public readonly blockType: Target
  ) {
    super();
  }

  toCodeString(): string {
    if (this._id === undefined) {
      this._id = TemplateParameter.issueId();
    }
    return TemplateBlock.CODE_STRING_PREFIX + this._id.toString();
  }

  toPatternNode(cursor: AstCursor): PatternNode {
    return new BlockNode(
      cursor.currentNode.text,
      cursor.currentFieldName,
      this
    );
  }
}
