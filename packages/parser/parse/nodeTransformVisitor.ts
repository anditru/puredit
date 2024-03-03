import AstCursor from "../ast/cursor";
import TemplateParameter from "../template/parameters/templateParameter";
import PatternNode from "../pattern/nodes/patternNode";
import RegularNode, { RegularNodeBuilder } from "../pattern/nodes/regularNode";
import TemporaryAggregationNode from "../pattern/nodes/temporaryAggregationNode";
import Template from "../template/template";
import { Language } from "@puredit/language-config";

export default class NodeTransformVisitor {
  private cursor: AstCursor | undefined;
  private language: Language;

  constructor(template: Template) {
    this.language = template.language;
  }

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
      .setText(this.cursor!.currentNode.text)
      .setFieldName(this.cursor!.currentFieldName);

    this.cursor!.goToFirstChild();
    patternNodeBuilder.setChildren(this.recurse());

    /* To make the BlockNode actually replace the AST node representing the code block
     * we need to shift it up. */
    if (patternNodeBuilder.buildsParentOfBlockNode()) {
      const firstChild = patternNodeBuilder.children[0];
      firstChild.fieldName = patternNodeBuilder.fieldName!;
      return firstChild;
    }
    if (patternNodeBuilder.buildsParentOfAggregationNode()) {
      const firstChild = patternNodeBuilder.children[0] as TemporaryAggregationNode;
      return firstChild.toAggregationNode(patternNodeBuilder.fieldName!);
    }

    return patternNodeBuilder.buildAndSetParentOnChildren();
  }

  private transformAtomicNode(): PatternNode {
    if (this.cursor!.currentNode.isTemplateParameterNode()) {
      const parameterId = this.cursor!.currentNode.getTemplateParameterId();
      const correspondingParameter = this.findTemplateParameterBy(parameterId);
      return correspondingParameter.toPatternNode(this.cursor!, this.language);
    } else {
      return this.transformRegularNode();
    }
  }

  private findTemplateParameterBy(id: number) {
    const result = TemplateParameter.templateParameterRegistry.get(id);
    if (!result) {
      throw new Error(`No parameter with ID ${id} found`);
    }
    return result;
  }

  private transformRegularNode() {
    return new RegularNode(
      this.cursor!.currentNode.type,
      this.cursor!.currentNode.text,
      this.cursor!.currentFieldName
    );
  }
}
