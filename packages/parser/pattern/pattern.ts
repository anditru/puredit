import PatternNode from "./nodes/patternNode";
import TreePath from "../cursor/treePath";
import RawTemplate from "../define/rawTemplate";

export default interface Pattern {
  getTypesMatchedByRootNode(): string[];
  getPathToNodeWithText(text: string): TreePath;
  get template(): RawTemplate;
  get name(): string;
  get rootNode(): PatternNode;
  get priority(): number;
}
