import { isErrorToken } from "../common";
import type { PatternNode } from "../types";
import AstCursor from "../ast/cursor";
import TemplateParameter from "../define/templateParameter";
import { isString } from "@puredit/utils";

export class NodeTransformVisitor {
  constructor(private readonly params: (string | TemplateParameter)[]) {}

  visit(cursor: AstCursor, code: string): PatternNode[] {
    const nodes = [];
    do {
      if (isErrorToken(cursor.currentNode.type)) {
        throw new Error(
          `error in pattern ast at position ${cursor.startIndex}: ${cursor.currentNode.text}`
        );
      }
      // Skip keywords
      if (cursor.currentNode.isKeyword()) {
        continue;
      }

      if (
        !cursor.currentNode.shouldTreatAsAtomicNode() &&
        cursor.currentNode.hasChildren()
      ) {
        const node = this.transformNonAtomicNode(cursor, code);
        cursor.goToParent();
        nodes.push(node);
      } else {
        const node = this.transformAtomicNode(cursor);
        nodes.push(node);
      }
    } while (cursor.goToNextSibling());
    return nodes;
  }

  private transformNonAtomicNode(cursor: AstCursor, code: string): PatternNode {
    let patternNode = this.getInitialPatternNode(cursor);
    cursor.goToFirstChild();
    patternNode.children = this.visit(cursor, code);

    if (
      (patternNode.type === "block" ||
        patternNode.type === "expression_statement") &&
      patternNode.children[0].type === "TemplateBlock"
    ) {
      const fieldName = patternNode.fieldName;
      patternNode = patternNode.children[0];
      patternNode.fieldName = fieldName;
    }

    return patternNode;
  }

  private getInitialPatternNode(cursor: AstCursor): PatternNode {
    return {
      type: cursor.currentNode.type,
      fieldName: cursor.currentFieldName || undefined,
    };
  }

  private transformAtomicNode(cursor: AstCursor): PatternNode {
    if (cursor.currentNode.isTemplateParameterNode()) {
      const parameterId = cursor.currentNode.getTemplateParameterId();
      const correspondingParameter = this.findTemplateParameterBy(parameterId);
      return correspondingParameter.toPatternNode(cursor);
    } else {
      return this.transformRegularNode(cursor);
    }
  }

  private findTemplateParameterBy(id: number) {
    for (const param of this.params) {
      if (isString(param)) {
        continue;
      }
      if (param.id === id) {
        return param;
      }
    }
    throw new Error(`No parameter with ID ${id} found`);
  }

  private transformRegularNode(cursor: AstCursor) {
    const patternNode = this.getInitialPatternNode(cursor);
    patternNode.text = cursor.currentNode.text;
    return patternNode;
  }
}
