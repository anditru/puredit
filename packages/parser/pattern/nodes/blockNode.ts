import PatternNode from "./patternNode";
import AstCursor from "../../ast/cursor";
import { Language, loadBlocksConfigFor } from "@puredit/language-config";
import { ContextVariableMap } from "@puredit/projections";

export default class BlockNode extends PatternNode {
  static readonly TYPE = "BlockNode";

  public readonly astNodeType: string;
  public readonly contextVariables: ContextVariableMap;

  constructor(
    language: Language,
    fieldName: string | undefined,
    text: string,
    contextVariables: ContextVariableMap
  ) {
    super(language, BlockNode.TYPE, fieldName, text);
    this.contextVariables = contextVariables;
    this.astNodeType = loadBlocksConfigFor(this.language).blockNodeType;
  }

  getMatchedTypes(): string[] {
    return [this.astNodeType];
  }

  matches(astCursor: AstCursor): boolean {
    const astNode = astCursor.currentNode;
    return (
      this.astNodeType === astNode.cleanNodeType && astCursor.currentFieldName === this.fieldName
    );
  }

  toDraftString(): string {
    const blocksConfig = loadBlocksConfigFor(this.language);
    return blocksConfig.draft;
  }
}
