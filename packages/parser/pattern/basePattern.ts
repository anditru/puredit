import PatternNode from "./nodes/patternNode";
import Pattern from "./pattern";
import TreePath from "../cursor/treePath";
import { Language } from "@puredit/language-config";

export default class BasePattern implements Pattern {
  private readonly numberOfLeafNodes: number;

  constructor(
    public readonly name: string,
    public readonly language: Language,
    public readonly rootNode: PatternNode
  ) {
    this.rootNode.assignToPattern(this);
    this.numberOfLeafNodes = this.countLeafNodes();
  }

  private assertRootNodeSet() {
    if (!this.rootNode) {
      throw new Error("Pattern has no root node");
    }
  }

  countLeafNodes(): number {
    return this.recurseCountNumberOfLeafNodes(this.rootNode, 0);
  }

  recurseCountNumberOfLeafNodes(currentNode: PatternNode, currentNumber: number): number {
    if (currentNode.isLeafNode()) {
      return 1;
    }
    for (const childNode of currentNode.children) {
      currentNumber += this.recurseCountNumberOfLeafNodes(childNode, currentNumber);
    }
    return currentNumber;
  }

  getTypesMatchedByRootNode(): string[] {
    return this.rootNode.getMatchedTypes() || [];
  }

  getPathToNodeWithText(text: string): TreePath {
    this.assertRootNodeSet();
    const result = this.findPathByDfs(text, this.rootNode);
    if (!result) {
      throw new Error(`Node with text ${text} does not exist in this pattern`);
    }
    return new TreePath(result);
  }

  private findPathByDfs(
    targetText: string,
    currentNode: PatternNode,
    currentPath: number[] = []
  ): number[] | null {
    // This is for the root node since it does not have a child index
    if (currentNode.hasParent()) {
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

  toDraftString(): string {
    return this.rootNode.toDraftString();
  }

  getSubPatterns(): Pattern[] {
    return [];
  }

  get priority(): number {
    return this.numberOfLeafNodes;
  }
}
