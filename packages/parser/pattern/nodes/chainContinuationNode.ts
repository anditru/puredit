import PatternNode from "./patternNode";
import AstCursor from "../../ast/cursor";
import { Language, loadChainableNodeTypesFor } from "@puredit/language-config";
import { ContextVariableMap } from "@puredit/projections";

export default class ChainContinuationNode extends PatternNode {
  static readonly TYPE = "ChainContinuationNode";
  static readonly TEXT = "__chain_continuation_";

  private readonly astNodeTypes: string[];
  constructor(
    language: Language,
    startPatternRootNode: PatternNode,
    startIndex: number,
    endIndex: number
  ) {
    super(
      language,
      ChainContinuationNode.TYPE,
      undefined,
      ChainContinuationNode.TEXT,
      startIndex,
      endIndex
    );
    const chainableNodeTypes = loadChainableNodeTypesFor(this.language);
    this.astNodeTypes = [...chainableNodeTypes, ...startPatternRootNode.getMatchedTypes()];
  }

  getMatchedTypes(): string[] {
    return this.astNodeTypes;
  }

  matches(astCursor: AstCursor): boolean {
    return this.astNodeTypes.includes(astCursor.currentNode.type);
  }

  toDraftString(): string {
    return "";
  }
}
