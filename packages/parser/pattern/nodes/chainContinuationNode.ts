import PatternNode from "./patternNode";
import AstCursor from "../../ast/cursor";
import { Language } from "../../config/types";
import TemplateChain from "../../define/templateChain";
import { loadChainableNodeTypesFor } from "../../config/load";

export default class ChainContinuationNode extends PatternNode {
  static readonly TYPE = "ChainContinuationNode";

  private readonly astNodeTypes: string[];

  constructor(
    language: Language,
    startPatternRootNode: PatternNode,
    public readonly templateChain: TemplateChain
  ) {
    super(language, ChainContinuationNode.TYPE, "__chain_continuation_", undefined);
    const chainableNodeTypes = loadChainableNodeTypesFor(language);
    this.astNodeTypes = [...chainableNodeTypes, ...startPatternRootNode.getMatchedTypes()];
  }

  getMatchedTypes(): string[] {
    return this.astNodeTypes;
  }

  matches(astCursor: AstCursor): boolean {
    return this.astNodeTypes.includes(astCursor.currentNode.type);
  }
}
