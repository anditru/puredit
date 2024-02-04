import AstCursor from "../ast/cursor";
import TemplateParameter from "../define/templateParameter";
import { isString } from "@puredit/utils";
import PatternNode from "../pattern/nodes/patternNode";
import RegularNode, { RegularNodeBuilder } from "../pattern/nodes/regularNode";
import { Target } from "../treeSitterParser";
import TemplateAggregation from "../define/templateAggregation";

export class NodeTransformVisitor {
  cursor: AstCursor | undefined;

  constructor(
    public readonly targetLanguage: Target,
    private params: (string | TemplateParameter)[]
  ) {}

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
      .setLanguage(this.targetLanguage)
      .setType(this.cursor!.currentNode.type)
      .setText(this.cursor!.currentNode.text)
      .setFieldName(this.cursor!.currentFieldName);

    this.cursor!.goToFirstChild();
    patternNodeBuilder.setChildren(this.recurse());

    /* To make the BlockNode actually replace the AST node representing the code block
     * we need to shift it up. */
    if (patternNodeBuilder.buildsParentOfBlockNode()) {
      return patternNodeBuilder.children[0];
    }

    return patternNodeBuilder.buildAndSetParentOnChildren();
  }

  private transformAtomicNode(): PatternNode {
    if (this.cursor!.currentNode.isTemplateParameterNode()) {
      const parameterId = this.cursor!.currentNode.getTemplateParameterId();
      const correspondingParameter = this.findTemplateParameterBy(parameterId);
      return correspondingParameter.toPatternNode(this.cursor!, this.targetLanguage);
    } else {
      return this.transformRegularNode();
    }
  }

  private findTemplateParameterBy(id: number) {
    const result = this.recursefindTemplateParameterBy(id, this.params!);
    if (result !== null) {
      return result;
    } else {
      throw new Error(`No parameter with ID ${id} found`);
    }
  }

  private recursefindTemplateParameterBy(
    id: number,
    params: (string | TemplateParameter)[]
  ): TemplateParameter | null {
    for (const param of params) {
      if (isString(param)) {
        continue;
      }
      if (param.id === id) {
        return param;
      }
      if (param instanceof TemplateAggregation) {
        for (const allowedPattern of param.allowedPatterns) {
          const result = this.recursefindTemplateParameterBy(id, allowedPattern.params);
          if (result !== null) {
            return result;
          }
        }
        return null;
      }
    }
    return null;
  }

  private transformRegularNode() {
    return new RegularNode(
      this.targetLanguage,
      this.cursor!.currentNode.type,
      this.cursor!.currentNode.text,
      this.cursor!.currentFieldName
    );
  }
}
