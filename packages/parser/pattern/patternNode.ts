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

  abstract matches(astNode: AstNode): boolean;
}
