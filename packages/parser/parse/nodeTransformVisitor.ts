import AstCursor from "../ast/cursor";
import TemplateParameter from "../define/templateParameter";
import { isString } from "@puredit/utils";
import PatternNode from "../pattern/patternNode";
import RegularNode, { RegularNodeBuilder } from "../pattern/regularNode";

export class NodeTransformVisitor {
  constructor(private readonly params: (string | TemplateParameter)[]) {}

  visit(cursor: AstCursor, code: string): PatternNode[] {
    const nodes = [];
    do {
      if (cursor.currentNode.isErrorToken()) {
        throw new Error(
          `error in pattern ast at position ${cursor.startIndex}: ${cursor.currentNode.text}`
        );
      }

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
    const patternNodeBuilder = new RegularNodeBuilder();
    patternNodeBuilder
      .setType(cursor.currentNode.type)
      .setFieldName(cursor.currentFieldName);

    cursor.goToFirstChild();
    patternNodeBuilder.setChildren(this.visit(cursor, code));

    if (
      ["block", "expression_statement"].includes(patternNodeBuilder.type!) &&
      patternNodeBuilder.children[0].type === "TemplateBlock"
    ) {
      const firstChild = patternNodeBuilder.children[0];
      patternNodeBuilder
        .setType(firstChild.type)
        .setChildren(firstChild.children);
    }

    return patternNodeBuilder.build();
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
    return new RegularNode(
      cursor.currentNode.type,
      cursor.currentNode.text,
      cursor.currentFieldName
    );
  }
}
