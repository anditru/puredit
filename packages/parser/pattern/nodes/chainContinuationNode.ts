import PatternNode from "./patternNode";
import AstCursor from "../../ast/cursor";
import { Language } from "../../config/types";

export default class ChainContinuationNode extends PatternNode {
  static readonly TYPE = "ChainContinuationNode";

  constructor(language: Language) {
    super(language, ChainContinuationNode.TYPE, "chainContinuation", undefined);
  }

  getMatchedTypes(): string[] {
    return ["*"];
  }

  matches(astCursor: AstCursor): boolean {
    // TODO
    return false;
  }
}
