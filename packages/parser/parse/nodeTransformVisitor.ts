import AstCursor from "../ast/cursor";
import PatternNode from "../pattern/nodes/patternNode";
import RegularNode, { RegularNodeBuilder } from "../pattern/nodes/regularNode";
import TemporaryAggregationNode from "../pattern/nodes/temporaryAggregationNode";
import Template from "../template/template";
import { Language } from "@puredit/language-config";
import ParameterTable from "../template/codeString";

export default class NodeTransformVisitor {
  private language: Language;
  private cursor: AstCursor | undefined;
  private codeString: ParameterTable | undefined;

  constructor(template: Template) {
    this.language = template.language;
  }

  visit(cursor: AstCursor, codeString: ParameterTable): PatternNode[] {
    this.cursor = cursor;
    this.codeString = codeString;
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
    const templateParameter = this.codeString!.resolveParameter(
      this.cursor!.currentNode.startIndex,
      this.cursor!.currentNode.endIndex
    );
    if (templateParameter) {
      return templateParameter.toPatternNode(this.cursor!, this.language);
    } else {
      return this.transformRegularNode();
    }
  }

  private transformRegularNode() {
    return new RegularNode(
      this.cursor!.currentNode.type,
      this.cursor!.currentNode.text,
      this.cursor!.currentFieldName
    );
  }
}
