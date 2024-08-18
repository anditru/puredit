import PatternNode from "./patternNode";
import AstCursor from "../../ast/cursor";
import { Language, loadArgumentsConfigFor, typePlaceHolder } from "@puredit/language-config";

export default class ArgumentNode extends PatternNode {
  static readonly TYPE: string = "ArgumentNode";

  public readonly name: string;
  public readonly astNodeTypes: string[];

  constructor(
    name: string,
    language: Language,
    astNodeTypes: string[],
    fieldName: string | undefined,
    text: string
  ) {
    super(language, ArgumentNode.TYPE, fieldName, text);
    this.name = name;
    this.astNodeTypes = astNodeTypes;
  }

  getMatchedTypes(): string[] {
    return this.astNodeTypes;
  }

  matches(astCursor: AstCursor): boolean {
    const astNode = astCursor.currentNode;
    return (
      this.astNodeTypes.includes(astNode.cleanNodeType) &&
      astCursor.currentFieldName === this.fieldName
    );
  }

  toDraftString(): string {
    let type = this.astNodeTypes.find((type) => type !== "string");
    if (!type) {
      type = this.astNodeTypes[0];
    }
    const argumentsConfig = loadArgumentsConfigFor(this.language);
    const maybeDraft = argumentsConfig.draftTypeMapping[type];
    if (maybeDraft) {
      return maybeDraft;
    } else {
      return argumentsConfig.draftTypeMapping["default"].replace(typePlaceHolder, type);
    }
  }
}
