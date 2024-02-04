import PatternNode from "./nodes/patternNode";
import PatternPath from "./patternPath";

export default interface Pattern {
  get rootNode(): PatternNode;
  get rootNodeType(): string;
  getDraft(): string;
  getPathToNodeWithText(text: string): PatternPath;
}
