import AstCursor from "../../ast/cursor";
import Template from "../template";
import TemplateParameter from "./templateParameter";
import PatternNode from "../../pattern/nodes/patternNode";
import {
  aggregationPlaceHolder,
  aggregationStartPlaceHolder,
  loadAggregatableNodeTypeConfigFor,
} from "@puredit/language-config";
import { ContextVariableMap } from "@puredit/projections";
import AggregationNode from "../../pattern/nodes/aggregationNode";
import CodeString from "../codeString";

export default class TemplateAggregation extends TemplateParameter {
  static readonly CODE_STRING_PREFIX = "__template_agg_";

  constructor(
    public readonly name: string,
    public readonly type: string,
    public readonly subPatterns: Template[],
    public readonly specialStartPattern: Template | undefined,
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
    const innerCodeString =
      identifyingCodeString + aggregatableNodeTypeConfig.delimiterToken + subPatternCodeString.raw;

    let codeString;
    if (aggregatableNodeTypeConfig.specialStartPattern) {
      if (!this.specialStartPattern) {
        throw new Error(`Aggregation of node type ${this.type} requires special start pattern`);
      }
      const startCodeString = this.specialStartPattern.toCodeString();
      codeString = aggregatableNodeTypeConfig.contextTemplate
        .replace(aggregationStartPlaceHolder, startCodeString.raw)
        .replace(aggregationPlaceHolder, innerCodeString);
    } else {
      codeString =
        aggregatableNodeTypeConfig.startToken +
        innerCodeString +
        aggregatableNodeTypeConfig.endToken;
    }
    return codeString;
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
    const nodeTypeConfig = loadAggregatableNodeTypeConfigFor(this.template!.language, this.type);
    return (
      nodeTypeConfig.startToken + this.subPatterns[0].toDraftString() + nodeTypeConfig.endToken
    );
  }

  copy(): TemplateAggregation {
    return new TemplateAggregation(
      this.name,
      this.type,
      this.subPatterns,
      this.specialStartPattern,
      this.contextVariables
    );
  }
}
