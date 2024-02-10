import PatternNode from "./patternNode";
import AstNode from "../../ast/node";
import { Target } from "../../treeSitterParser";

export default class ChainContinuationNode extends PatternNode {
  static readonly TYPE = "ChainContinuationNode";

  constructor(language: Target) {
    super(language, ChainContinuationNode.TYPE, "chainContinuation", null);
  }

  getMatchedTypes(): string[] {
    return ["*"];
  }

  matches(astNode: AstNode): boolean {
    // TODO
    return false;
  }
}
