import PatternNode from "./patternNode";
import { Target } from "../../treeSitterParser";
import AstCursor from "../../ast/cursor";

export default class ChainContinuationNode extends PatternNode {
  static readonly TYPE = "ChainContinuationNode";

  constructor(language: Target) {
    super(language, ChainContinuationNode.TYPE, "chainContinuation", null);
  }

  getMatchedTypes(): string[] {
    return ["*"];
  }

  matches(astCursor: AstCursor): boolean {
    // TODO
    return false;
  }
}
