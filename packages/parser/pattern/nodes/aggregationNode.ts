import PatternNode from "./patternNode";
import AstCursor from "../../ast/cursor";
import { Language, loadAggregatableNodeTypeConfigFor } from "@puredit/language-config";
import AggregationDecorator from "../decorators/aggregationDecorator";
import { ContextVariableMap } from "@puredit/projections";

export default class AggregationNode extends PatternNode {
  static readonly TYPE = "AggregationNode";

  public readonly name: string;
  public readonly astNodeType: string;
  public readonly hasStartPattern: boolean;
  public readonly contextVariables: ContextVariableMap;

  constructor(
    name: string,
    language: Language,
    astNodeType: string,
    fieldName: string | undefined,
    text: string,
    hasStartPattern: boolean,
    contextVariables: ContextVariableMap
  ) {
    super(language, AggregationNode.TYPE, fieldName, text);
    this.name = name;
    this.astNodeType = astNodeType;
    this.contextVariables = contextVariables;
    this.hasStartPattern = hasStartPattern;

    const nodeTypeConfig = loadAggregatableNodeTypeConfigFor(this.language, astNodeType);
    if (!nodeTypeConfig) {
      throw new Error(
        `AST node type ${astNodeType} of language ${this.language} is not supported for aggregation`
      );
    }
  }

  getMatchedTypes(): string[] {
    return [this.astNodeType];
  }

  matches(astCursor: AstCursor): boolean {
    const astNode = astCursor.currentNode;
    return this.astNodeType === astNode.type && this.fieldName === astCursor.currentFieldName;
  }

  toDraftString(): string {
    if (!this.owningPattern) {
      throw new Error("Aggregation node not assigned to pattern. Cannot build draft string");
    }
    const pattern = this.owningPattern as AggregationDecorator;
    const nodeTypeConfig = loadAggregatableNodeTypeConfigFor(this.language, this.astNodeType);
    const startPattern = pattern.getStartPatternFor(this.name);
    let startString = "";
    if (startPattern) {
      startString = startPattern.toDraftString();
    }
    const partPatterns = pattern.getPartPatternsFor(this.name);
    return (
      startString +
      nodeTypeConfig.startToken +
      "\n" +
      "    " +
      partPatterns[0].toDraftString() +
      "\n" +
      nodeTypeConfig.endToken
    );
  }
}
