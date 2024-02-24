import PatternNode from "./nodes/patternNode";
import TreePath from "../cursor/treePath";
import Template from "../template/template";
import { Language } from "@puredit/language-config";

export default interface Pattern {
  getTypesMatchedByRootNode(): string[];
  getPathToNodeWithText(text: string): TreePath;
  toDraftString(): string;
  get language(): Language;
  get template(): Template;
  get name(): string;
  get rootNode(): PatternNode;
  get priority(): number;
}
