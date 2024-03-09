import AstCursor from "../../ast/cursor";
import Template from "../template";
import TemplateParameter from "./templateParameter";
import PatternNode from "../../pattern/nodes/patternNode";
import { loadAggregatableNodeTypeConfigFor } from "@puredit/language-config";
import { ContextVariableMap } from "@puredit/projections";
import AggregationNode from "../../pattern/nodes/aggregationNode";

export default class TemplateAggregation extends TemplateParameter {
  static readonly CODE_STRING_PREFIX = "__template_agg_";

  constructor(
    public readonly name: string,
    public readonly type: string,
    public readonly subPatterns: Template[],
    public readonly contextVariables: ContextVariableMap
  ) {
    super();
  }

  toCodeString(): string {
    this.checkAssignedToTemplate();
    const aggregatableNodeTypeConfig = loadAggregatableNodeTypeConfigFor(
      this.template!.language,
      this.type
    );
    const subPatternCodeString = this.subPatterns[0].toCodeString();
    const identifyingCodeString = this.getIdentifyingCodeString();
    return (
      aggregatableNodeTypeConfig.startToken +
      identifyingCodeString +
      aggregatableNodeTypeConfig.delimiterToken +
      subPatternCodeString.raw +
      aggregatableNodeTypeConfig.endToken
    );
  }

  getIdentifyingCodeString(): string {
    return TemplateAggregation.CODE_STRING_PREFIX + this.id.toString();
  }

  toPatternNode(cursor: AstCursor): PatternNode {
    this.checkAssignedToTemplate();
    return new AggregationNode(
      this.template!.language,
      cursor.currentNode.text,
      cursor.currentFieldName,
      this.type,
      this
    );
  }

  toDraftString(): string {
    return this.subPatterns[0].toDraftString();
  }

  copy(): TemplateAggregation {
    return new TemplateAggregation(this.name, this.type, this.subPatterns, this.contextVariables);
  }
}
