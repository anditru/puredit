import PatternNode from "../nodes/patternNode";
import Pattern from "../pattern";
import TreePath from "../../cursor/treePath";

export default abstract class PatternDecorator implements Pattern {
  constructor(private pattern: Pattern) {}

  get rootNode(): PatternNode {
    return this.pattern.rootNode;
  }

  getTypesMatchedByRootNode(): string[] {
    return this.pattern.getTypesMatchedByRootNode();
  }

  getPathToNodeWithText(text: string): TreePath {
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
