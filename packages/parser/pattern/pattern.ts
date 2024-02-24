import PatternNode from "./nodes/patternNode";
import TreePath from "../cursor/treePath";
import Template from "../define/template";

export default interface Pattern {
  getTypesMatchedByRootNode(): string[];
  getPathToNodeWithText(text: string): TreePath;
  toDraftString(): string;
  get template(): Template;
  get name(): string;
  get rootNode(): PatternNode;
  get priority(): number;
}
