import PatternNode from "./nodes/patternNode";
import TreePath from "../cursor/treePath";
import { Language } from "@puredit/language-config";

/**
 * @interface
 * Common interface for all patterns.
 */
export default interface Pattern {
  getTypesMatchedByRootNode(): string[];
  getPathToNodeWithText(text: string): TreePath;
  toDraftString(): string;
  getSubPatterns(): Pattern[];
  get language(): Language;
  get name(): string;
  get rootNode(): PatternNode;
  get priority(): number;
}
