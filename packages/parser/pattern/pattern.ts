import PatternNode from "./nodes/patternNode";
import PatternPath from "./patternPath";

export default interface Pattern {
  getTypesMatchedByRootNode(): string[];
  getDraft(): string;
  getPathToNodeWithText(text: string): PatternPath;
  get name(): string;
  get rootNode(): PatternNode;
  get priority(): number;
}
