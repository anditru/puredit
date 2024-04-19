import AstCursor from "../../ast/cursor";
import Template from "../template";
import TemplateParameter from "./templateParameter";
import PatternNode from "../../pattern/nodes/patternNode";
import ChainNode from "../../pattern/nodes/chainNode";
import { ContextVariableMap } from "@puredit/projections";

export default class TemplateChain extends TemplateParameter {
  static readonly CODE_STRING_PREFIX = "__template_chain_";

  constructor(
    public readonly name: string,
    public readonly startPattern: Template,
    public readonly linkPatterns: Template[],
    public readonly minimumLength: number,
    public readonly contextVariables: ContextVariableMap
  ) {
    super();
  }

  toCodeString(): string {
    return TemplateChain.CODE_STRING_PREFIX + this.id.toString();
  }

  toPatternNode(cursor: AstCursor): PatternNode {
    this.checkAssignedToTemplate();
    return new ChainNode(
      this.template!.language,
      cursor.currentNode.text,
      cursor.currentFieldName,
      this.minimumLength,
      this
    );
  }

  toDraftString(): string {
    const startDraftString = this.startPattern.toDraftString();
    const linkDraftPatterns = this.linkPatterns
      .slice(0, 2)
      .map((linkPattern) => linkPattern.toDraftString());
    return [startDraftString, ...linkDraftPatterns].join(".");
  }

  copy(): TemplateChain {
    return new TemplateChain(
      this.name,
      this.startPattern,
      this.linkPatterns,
      this.minimumLength,
      this.contextVariables
    );
  }
}
