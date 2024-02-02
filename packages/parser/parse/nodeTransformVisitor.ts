import AstCursor from "../ast/cursor";
import TemplateParameter from "../define/templateParameter";
import { isString } from "@puredit/utils";
import PatternNode from "../pattern/patternNode";
import RegularNode, { RegularNodeBuilder } from "../pattern/regularNode";

export class NodeTransformVisitor {
  cursor: AstCursor | undefined;

  constructor(private readonly params: (string | TemplateParameter)[]) {}

  visit(cursor: AstCursor): PatternNode[] {
    this.cursor = cursor;
    return this.recurse();
  }

  recurse(): PatternNode[] {
    const nodes: PatternNode[] = [];
    do {
      this.checkNoErrorToken();
      if (this.cursor!.currentNode.isKeyword()) {
        continue;
      }
      nodes.push(this.transformCurrentNode());
    } while (this.cursor!.goToNextSibling());
    return nodes;
  }

  private checkNoErrorToken() {
    if (this.cursor!.currentNode.isErrorToken()) {
      throw new Error(
        `error in pattern ast at position ${this.cursor!.startIndex}: ` +
          `${this.cursor!.currentNode.text}`
      );
    }
  }

  private transformCurrentNode(): PatternNode {
    let transformedNode;
    if (
      !this.cursor!.currentNode.shouldTreatAsAtomicNode() &&
      this.cursor!.currentNode.hasChildren()
    ) {
      transformedNode = this.transformNonAtomicNode();
      this.cursor!.goToParent();
    } else {
      transformedNode = this.transformAtomicNode();
    }
    return transformedNode;
  }

  private transformNonAtomicNode(): PatternNode {
    const patternNodeBuilder = new RegularNodeBuilder();
    patternNodeBuilder
      .setType(this.cursor!.currentNode.type)
      .setFieldName(this.cursor!.currentFieldName);

    this.cursor!.goToFirstChild();
    patternNodeBuilder.setChildren(this.recurse());

    if (
      ["block", "expression_statement"].includes(patternNodeBuilder.type!) &&
      patternNodeBuilder.children[0].type === "TemplateBlock"
    ) {
      const firstChild = patternNodeBuilder.children[0];
      patternNodeBuilder.setType(firstChild.type).setChildren(firstChild.children);
    }

    return patternNodeBuilder.buildAndSetParentOnChildren();
  }

  private transformAtomicNode(): PatternNode {
    if (this.cursor!.currentNode.isTemplateParameterNode()) {
      const parameterId = this.cursor!.currentNode.getTemplateParameterId();
      const correspondingParameter = this.findTemplateParameterBy(parameterId);
      return correspondingParameter.toPatternNode(this.cursor!);
    } else {
      return this.transformRegularNode();
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

  private transformRegularNode() {
    return new RegularNode(
      this.cursor!.currentNode.type,
      this.cursor!.currentNode.text,
      this.cursor!.currentFieldName
    );
  }
}
