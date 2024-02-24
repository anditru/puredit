import AstCursor from "../../ast/cursor";
import { Language, loadArgumentsConfigFor, typePlaceHolder } from "@puredit/language-config";
import ArgumentNode from "../../pattern/nodes/argumentNode";
import TemplateParameter from "./templateParameter";

export default class TemplateArgument extends TemplateParameter {
  static readonly CODE_STRING_PREFIX = "__template_arg_";

  constructor(public readonly name: string, public readonly types: string[]) {
    super();
  }

  toCodeString(): string {
    if (this._id === undefined) {
      this._id = TemplateParameter.issueId();
    }
    return TemplateArgument.CODE_STRING_PREFIX + this._id.toString();
  }

  toPatternNode(cursor: AstCursor, language: Language) {
    return new ArgumentNode(cursor.currentNode.text, cursor.currentFieldName, this);
  }

  toDraftString(language: Language): string {
    if (this.types.length === 1) {
      return this.getDraftStringForSingeType(this.types[0], language);
    } else {
      return this.getDraftStringForMultipleTypes(language);
    }
  }

  private getDraftStringForSingeType(type: string, language: Language): string {
    const argumentsConfig = loadArgumentsConfigFor(language);
    const maybeDraft = argumentsConfig.draftTypeMapping[type];
    if (maybeDraft) {
      return maybeDraft;
    } else {
      return argumentsConfig.draftTypeMapping["default"].replace(typePlaceHolder, this.types[0]);
    }
  }

  private getDraftStringForMultipleTypes(language: Language): string {
    return this.types.map((type) => this.getDraftStringForSingeType(type, language)).join("_or_");
  }
}
