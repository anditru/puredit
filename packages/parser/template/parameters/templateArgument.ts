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
    return TemplateArgument.CODE_STRING_PREFIX + this.id.toString();
  }

  toPatternNode(cursor: AstCursor) {
    this.checkAssignedToTemplate();
    return new ArgumentNode(cursor.currentNode.text, cursor.currentFieldName, this);
  }

  toDraftString(): string {
    this.checkAssignedToTemplate();
    if (this.types.length === 1) {
      return this.getDraftStringForSingeType(this.types[0], this.template!.language);
    } else {
      return this.getDraftStringForMultipleTypes(this.template!.language);
    }
  }

  private getDraftStringForSingeType(type: string, language: Language): string {
    const argumentsConfig = loadArgumentsConfigFor(language);
    const maybeDraft = argumentsConfig.draftTypeMapping[type];
    if (maybeDraft) {
      return maybeDraft;
    } else {
      return argumentsConfig.draftTypeMapping["default"].replace(typePlaceHolder, type);
    }
  }

  private getDraftStringForMultipleTypes(language: Language): string {
    return this.types
      .map((type) => {
        const argumentsConfig = loadArgumentsConfigFor(language);
        return argumentsConfig.draftTypeMapping["default"].replace(typePlaceHolder, type);
      })
      .join("_or");
  }
}
