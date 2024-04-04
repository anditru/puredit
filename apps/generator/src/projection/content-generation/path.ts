import AstCursor from "@puredit/parser/ast/cursor";
import { PatternCursor } from "./pattern";

export function selectDeepChild(cursor: AstCursor | PatternCursor, path: number[]): boolean {
  let first = true;
  for (const index of path) {
    if (!first && !cursor.goToFirstChild()) {
      return false;
    }
    for (let i = 0; i < index; i++) {
      if (!cursor.goToNextSibling()) {
        return false;
      }
    }
    first = false;
  }
  return true;
}
