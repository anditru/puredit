import AstCursor from "../../ast/cursor";
import Template from "../template";
import TemplateParameter from "./templateParameter";
import PatternNode from "../../pattern/nodes/patternNode";
import {
  aggregationPlaceHolder,
  aggregationStartPlaceHolder,
  Language,
  loadAggregatableNodeTypeConfigFor,
} from "@puredit/language-config";
import { ContextVariableMap } from "@puredit/projections";
import AggregationNode from "../../pattern/nodes/aggregationNode";
import Pattern from "../../pattern/pattern";

export default class TemplateAggregation extends TemplateParameter {
  static readonly CODE_STRING_PREFIX = "__template_agg_";

  constructor(
    public readonly name: string,
    public readonly type: string,
    public readonly partTemplates: Template[],
    public readonly startTemplate: Template | undefined,
    public readonly contextVariables: ContextVariableMap
  ) {
    super();
  }

  toCodeString(language: Language): string {
    const aggregatableNodeTypeConfig = loadAggregatableNodeTypeConfigFor(language, this.type);

    const subPatternCodeString = this.partTemplates[0].toCodeString(language);
    const identifyingCodeString = this.getIdentifyingCodeString();
    const innerCodeString =
      identifyingCodeString + aggregatableNodeTypeConfig.delimiterToken + subPatternCodeString.raw;

    let codeString;
    if (aggregatableNodeTypeConfig.specialStartPattern) {
      if (!this.startTemplate) {
        throw new Error(`Aggregation of node type ${this.type} requires special start pattern`);
      }
      const startCodeString = this.startTemplate.toCodeString(language);
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

  toPatternNode(cursor: AstCursor, language: Language): PatternNode {
    return new AggregationNode(
      this.name,
      language,
      this.type,
      cursor.currentFieldName,
      cursor.currentNode.text,
      !!this.startTemplate,
      this.contextVariables
    );
  }
}
