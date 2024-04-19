import AstCursor from "../ast/cursor";
import PatternNode from "../pattern/nodes/patternNode";
import RegularNode, { RegularNodeBuilder } from "../pattern/nodes/regularNode";
import ParameterTable from "../template/codeString";

export default class NodeTransformVisitor {
  private astCursor: AstCursor | undefined;
  private codeString: ParameterTable | undefined;

  visit(cursor: AstCursor, codeString: ParameterTable): PatternNode[] {
    this.astCursor = cursor;
    this.codeString = codeString;
    return this.recurse();
  }

  recurse(): PatternNode[] {
    const nodes: PatternNode[] = [];
    do {
      const ignoredNode = false;
      if (
        this.astCursor!.currentNode.type === "parenthesized_expression" &&
        this.astCursor!.currentNode.children[1].type === "call"
      ) {
        const fieldName = this.astCursor!.currentFieldName;
        this.astCursor!.goToFirstChild();
        this.astCursor!.goToNextSibling();
        this.astCursor!.currentFieldName = fieldName;
      }

      this.checkNoErrorToken();
      nodes.push(this.transformCurrentNode());

      if (ignoredNode) {
        this.astCursor!.goToParent();
      }
    } while (this.astCursor!.goToNextSibling());

    return nodes;
  }

  private checkNoErrorToken() {
    if (this.astCursor!.currentNode.isErrorToken()) {
      throw new Error(
        `error in pattern ast at position ${this.astCursor!.startIndex}: ` +
          `${this.astCursor!.currentNode.text}`
      );
    }
  }

  private transformCurrentNode(changedFieldName?: string): PatternNode {
    let transformedNode;
    if (!this.mustTreatNodeAsAtomic() && this.astCursor!.currentNode.hasChildren()) {
      transformedNode = this.transformNonAtomicNode(changedFieldName);
    } else {
      transformedNode = this.transformAtomicNode(changedFieldName);
    }
    return transformedNode;
  }

  private mustTreatNodeAsAtomic() {
    const currentNode = this.astCursor!.currentNode;
    const templateParameter = this.codeString!.resolveParameter(
      this.astCursor!.currentNode.startIndex,
      this.astCursor!.currentNode.endIndex
    );
    return currentNode.type === "string" || templateParameter;
  }

  private transformNonAtomicNode(changedFieldName?: string): PatternNode {
    const patternNodeBuilder = new RegularNodeBuilder();
    patternNodeBuilder
      .setType(this.astCursor!.currentNode.type)
      .setText(this.astCursor!.currentNode.text)
      .setFieldName(changedFieldName || this.astCursor!.currentFieldName);

    this.astCursor!.goToFirstChild();
    patternNodeBuilder.setChildren(this.recurse());

    /* To make the BlockNode actually replace the AST node representing the code block
     * we need to shift it up. */
    if (patternNodeBuilder.buildsParentOfBlockNode()) {
      const firstChild = patternNodeBuilder.children[0];
      firstChild.fieldName = patternNodeBuilder.fieldName!;
      return firstChild;
    }

    this.astCursor!.goToParent();
    return patternNodeBuilder.buildAndSetParentOnChildren();
  }

  private transformAtomicNode(changedFieldName?: string): PatternNode {
    const templateParameter = this.codeString!.resolveParameter(
      this.astCursor!.currentNode.startIndex,
      this.astCursor!.currentNode.endIndex
    );
    if (templateParameter) {
      return templateParameter.toPatternNode(this.astCursor!);
    } else {
      return this.transformRegularNode(changedFieldName);
    }
  }

  private transformRegularNode(changedFieldName?: string) {
    return new RegularNode(
      this.astCursor!.currentNode.type,
      this.astCursor!.currentNode.text,
      changedFieldName || this.astCursor!.currentFieldName
    );
  }
}
