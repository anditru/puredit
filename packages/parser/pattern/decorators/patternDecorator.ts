import PatternNode from "../nodes/patternNode";
import Pattern from "../pattern";
import PatternPath from "../patternPath";

export default abstract class PatternDecorator implements Pattern {
  constructor(private pattern: Pattern) {}

  get rootNode(): PatternNode {
    return this.pattern.rootNode;
  }

  getTypesMatchedByRootNode(): string[] {
    return this.pattern.getTypesMatchedByRootNode();
  }

  getPathToNodeWithText(text: string): PatternPath {
    return this.pattern.getPathToNodeWithText(text);
  }

  getDraft(): string {
    return this.pattern.getDraft();
  }

  get name(): string {
    return this.pattern.name;
  }

  get priority(): number {
    return this.pattern.priority;
  }
}
