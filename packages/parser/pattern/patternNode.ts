import AstNode from "../ast/node";

export default abstract class PatternNode {
  public readonly fieldName: string | undefined;

  constructor(
    public readonly type: string,
    public readonly text: string,
    fieldName: string | null,
    public readonly children: PatternNode[] = []
  ) {
    if (!fieldName) {
      this.fieldName = undefined;
    } else {
      this.fieldName = fieldName;
    }
  }

  isTopNode(): boolean {
    return this.type === "program" || this.type === "module";
  }

  abstract matches(astNode: AstNode): boolean;
}
