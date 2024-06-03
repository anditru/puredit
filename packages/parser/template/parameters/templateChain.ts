import AstCursor from "../../ast/cursor";
import Template from "../template";
import TemplateParameter from "./templateParameter";
import PatternNode from "../../pattern/nodes/patternNode";
import ChainNode from "../../pattern/nodes/chainNode";
import { ContextVariableMap } from "@puredit/projections";
import { Language } from "@puredit/language-config";
import Pattern from "../../pattern/pattern";

export default class TemplateChain extends TemplateParameter {
  static readonly CODE_STRING_PREFIX = "__template_chain_";

  constructor(
    public readonly name: string,
    public readonly startTemplate: Template,
    public readonly linkTemplates: Template[],
    public readonly minimumLength: number,
    public readonly contextVariables: ContextVariableMap
  ) {
    super();
  }

  toCodeString(language: Language): string {
    return TemplateChain.CODE_STRING_PREFIX + this.id.toString();
  }

  toPatternNode(cursor: AstCursor, language: Language): PatternNode {
    return new ChainNode(
      this.name,
      language,
      cursor.currentFieldName,
      cursor.currentNode.text,
      this.minimumLength,
      this.contextVariables
    );
  }
}
