import PatternNode from "./patternNode";
import AstCursor from "../../ast/cursor";
import {
  Language,
  loadChainableNodeTypeConfigFor,
  loadChainableNodeTypesFor,
} from "@puredit/language-config";
import ChainDecorator from "../decorators/chainDecorator";
import { ContextVariableMap } from "@puredit/projections";

export default class ChainNode extends PatternNode {
  static readonly TYPE = "ChainNode";

  public readonly name: string;
  public readonly minumumLength: number;
  public readonly contextVariables: ContextVariableMap;
  private readonly astNodeTypes: string[];

  constructor(
    name: string,
    language: Language,
    fieldName: string | undefined,
    text: string,
    minumumLength: number,
    contextVariables: ContextVariableMap
  ) {
    super(language, ChainNode.TYPE, fieldName, text);
    this.name = name;
    this.minumumLength = minumumLength;
    this.contextVariables = contextVariables;
    this.astNodeTypes = loadChainableNodeTypesFor(this.language);
  }

  getMatchedTypes(): string[] {
    return this.astNodeTypes;
  }

  matches(astCursor: AstCursor): boolean {
    const astNode = astCursor.currentNode;
    return (
      this.astNodeTypes.includes(astNode.type) && this.fieldName === astCursor.currentFieldName
    );
  }

  toDraftString(): string {
    if (!this.owningPattern) {
      throw new Error("Chain node not assigned to pattern. Cannot build draft string");
    }
    const pattern = this.owningPattern as ChainDecorator;
    const startPattern = pattern.getStartPatternFor(this.name);
    const startDraftString = startPattern.toDraftString();
    const linkDraftPatterns = pattern
      .getLinkPatternsFor(this.name)
      .slice(0, this.minumumLength)
      .map((linkPattern) => linkPattern.toDraftString());
    return [startDraftString, ...linkDraftPatterns].join("");
  }
}
