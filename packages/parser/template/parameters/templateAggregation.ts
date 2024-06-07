import AstCursor from "../../ast/cursor";
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
import { Template, TransformableTemplate } from "../template";

export default class TemplateAggregation extends TemplateParameter {
  static readonly CODE_STRING_PREFIX = "__template_agg_";

  constructor(
    public readonly name: string,
    public readonly type: string,
    public readonly partTemplates: Template[],
    public readonly startTemplate: TransformableTemplate | undefined,
    public readonly contextVariables: ContextVariableMap
  ) {
    super();
  }

  toCodeString(language: Language): string {
    const aggregatableNodeTypeConfig = loadAggregatableNodeTypeConfigFor(language, this.type);
    const innerCodeString = TemplateAggregation.CODE_STRING_PREFIX + this.id.toString();
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
