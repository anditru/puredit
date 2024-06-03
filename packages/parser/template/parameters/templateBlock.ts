import AstCursor from "../../ast/cursor";
import TemplateParameter from "./templateParameter";
import PatternNode from "../../pattern/nodes/patternNode";
import BlockNode from "../../pattern/nodes/blockNode";
import { Language } from "@puredit/language-config";
import { ContextVariableMap } from "@puredit/projections";
import Pattern from "../../pattern/pattern";

export default class TemplateBlock extends TemplateParameter {
  static readonly CODE_STRING_PREFIX = "__template_block_";

  constructor(public readonly contextVariables: ContextVariableMap) {
    super();
  }

  toCodeString(language: Language): string {
    return TemplateBlock.CODE_STRING_PREFIX + this.id.toString();
  }

  toPatternNode(cursor: AstCursor, language: Language): PatternNode {
    return new BlockNode(
      language,
      cursor.currentFieldName,
      cursor.currentNode.text,
      this.contextVariables
    );
  }
}
