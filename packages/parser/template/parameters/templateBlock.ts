import AstCursor from "../../ast/cursor";
import TemplateParameter from "./templateParameter";
import PatternNode from "../../pattern/nodes/patternNode";
import BlockNode from "../../pattern/nodes/blockNode";
import { loadBlocksConfigFor } from "@puredit/language-config";
import { ContextVariableMap } from "@puredit/projections";

export default class TemplateBlock extends TemplateParameter {
  static readonly CODE_STRING_PREFIX = "__template_block_";

  constructor(public readonly contextVariables: ContextVariableMap) {
    super();
  }

  toCodeString(): string {
    return TemplateBlock.CODE_STRING_PREFIX + this.id.toString();
  }

  toPatternNode(cursor: AstCursor): PatternNode {
    this.checkAssignedToTemplate();
    return new BlockNode(
      this.template!.language,
      cursor.currentNode.text,
      cursor.currentFieldName,
      this
    );
  }

  toDraftString(): string {
    this.checkAssignedToTemplate();
    const blocksConfig = loadBlocksConfigFor(this.template!.language);
    return blocksConfig.draft;
  }
}
