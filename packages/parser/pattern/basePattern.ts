import PatternNode from "./nodes/patternNode";
import Pattern from "./pattern";
import PatternPath from "./patternPath";

export default class BasePattern implements Pattern {
  constructor(public readonly rootNode: PatternNode) {}

  get rootNodeType() {
    return this.rootNode.type;
  }

  getPathToNodeWithText(text: string): PatternPath {
    const result = this.findPathByDfs(text, this.rootNode);
    if (!result) {
      throw new Error(`Node with text ${text} does not exist in this pattern`);
    }
    return new PatternPath(result);
  }

  private findPathByDfs(
    targetText: string,
    currentNode: PatternNode,
    currentPath: number[] = []
  ): number[] | null {
    if (currentNode.hasParent()) {
      // This is for the root node since it does not have a child index
      const childIndex = currentNode.getChildIndex();
      currentPath.push(childIndex);
    }

    if (currentNode.text === targetText) {
      return currentPath;
    }

    for (const child of currentNode.children) {
      const result = this.findPathByDfs(targetText, child, [...currentPath]);

      if (result !== null) {
        return result;
      }
    }

    currentPath.pop();
    return null;
  }

  getDraft(): string {
    // TODO: Implement draft generation considering Aggregation variants
    return "__pattern";
  }
}
