import PatternNode from "./nodes/patternNode";
import TreePath from "../cursor/treePath";

export default interface Pattern {
  getTypesMatchedByRootNode(): string[];
  getDraft(): string;
  getPathToNodeWithText(text: string): TreePath;
  get name(): string;
  get rootNode(): PatternNode;
  get priority(): number;
}
