import AstCursor from "@puredit/parser/ast/cursor";
import TemplateParameter from "./parameter";

export default abstract class ComplexTemplateParameter extends TemplateParameter {
  abstract getEndIndex(astCursor: AstCursor): number;
  abstract getSubProjectionsCode(astCursor: AstCursor, sample: string): string;
}
