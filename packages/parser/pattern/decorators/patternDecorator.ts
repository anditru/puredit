import PatternNode from "../nodes/patternNode";
import Pattern from "../pattern";
import PatternPath from "../patternPath";

export default abstract class PatternDecorator implements Pattern {
  constructor(private pattern: Pattern) {}

  get rootNode(): PatternNode {
    return this.pattern.rootNode;
  }

  get rootNodeType(): string {
    return this.pattern.rootNodeType;
  }

  getPathToNodeWithText(text: string): PatternPath {
    return this.pattern.getPathToNodeWithText(text);
  }

  getDraft(): string {
    return this.pattern.getDraft();
  }
}
