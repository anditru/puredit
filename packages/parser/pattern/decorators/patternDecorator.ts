import PatternNode from "../nodes/patternNode";
import Pattern from "../pattern";
import TreePath from "../../cursor/treePath";
import { Language } from "@puredit/language-config";

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

  toDraftString(): string {
    return this.pattern.toDraftString();
  }

  get name(): string {
    return this.pattern.name;
  }

  get language(): Language {
    return this.pattern.language;
  }

  get priority(): number {
    return this.pattern.priority;
  }

  get template() {
    return this.pattern.template;
  }
}
