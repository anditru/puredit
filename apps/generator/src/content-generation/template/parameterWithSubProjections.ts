import AstCursor from "@puredit/parser/ast/cursor";
import TemplateParameter from "./parameter";

export default abstract class TemplateParameterWithSubProjections extends TemplateParameter {
  abstract getEndIndex(astCursor: AstCursor): number;
  abstract getSubprojectionsCode(astCursor: AstCursor, sample: string): string;
}
