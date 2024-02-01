import PatternNode from "./patternNode";

export default class Pattern {
  constructor(public readonly rootNode: PatternNode) {}

  get rootNodeType() {
    return this.rootNode.type;
  }

  getDraft(): string {
    // TODO: Implement draft generation considering Aggregation variants
    return "__pattern";
  }
}
