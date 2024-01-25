import { isErrorToken } from "../common";
import {
  TemplatePrefixes,
  type PatternNode,
  type TemplateArg,
  type TemplateBlock,
  type TemplateContextVariable,
} from "../types";
import { AstCursor } from "../astCursor";

export class NodeTransformVisitor {
  constructor(
    private readonly args: TemplateArg[],
    private readonly blocks: TemplateBlock[],
    private readonly contextVariables: TemplateContextVariable[]
  ) {}

  visit(cursor: AstCursor, code: string): PatternNode[] {
    const nodes = [];
    do {
      if (isErrorToken(cursor.nodeType)) {
        throw new Error(
          `error in pattern ast at position ${cursor.startIndex}: ${cursor.nodeText}`
        );
      }
      // Skip keywords
      if (cursor.isKeyword()) {
        continue;
      }

      if (!cursor.shouldTreatAsAtomicNode() && cursor.hasChildren()) {
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
      type: cursor.nodeType,
      fieldName: cursor.currentFieldName || undefined,
    };
  }

  private transformAtomicNode(cursor: AstCursor): PatternNode {
    if (cursor.isArgNode()) {
      return this.transformArgNode(cursor);
    } else if (cursor.isBlockNode()) {
      return this.transformBlockNode(cursor);
    } else if (cursor.isContextVariableNode()) {
      return this.transformContextVariableNode(cursor);
    } else {
      return this.transformRegularNode(cursor);
    }
  }

  private transformArgNode(cursor: AstCursor) {
    const patternNode = this.getInitialPatternNode(cursor);

    patternNode.text = cursor.nodeText;
    const index = parseInt(patternNode.text.slice(TemplatePrefixes.Arg.length));
    patternNode.arg = this.args[index];
    patternNode.type = "TemplateArg";

    return patternNode;
  }

  private transformBlockNode(cursor: AstCursor) {
    const patternNode = this.getInitialPatternNode(cursor);

    patternNode.text = cursor.nodeText;
    const index = parseInt(
      patternNode.text.slice(TemplatePrefixes.Block.length)
    );
    patternNode.block = this.blocks[index];
    patternNode.type = "TemplateBlock";

    return patternNode;
  }

  private transformContextVariableNode(cursor: AstCursor) {
    const patternNode = this.getInitialPatternNode(cursor);

    patternNode.text = cursor.nodeText;
    const index = parseInt(
      patternNode.text.slice(TemplatePrefixes.ContextVariable.length)
    );
    patternNode.contextVariable = this.contextVariables[index];
    patternNode.type = "TemplateContextVariable";

    return patternNode;
  }

  private transformRegularNode(cursor: AstCursor) {
    const patternNode = this.getInitialPatternNode(cursor);
    patternNode.text = cursor.nodeText;
    return patternNode;
  }
}
