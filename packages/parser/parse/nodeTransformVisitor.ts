import { isString } from "@puredit/utils";
import AstCursor from "../ast/cursor";
import TemplateParameter from "../template/parameters/templateParameter";
import TemplateAggregation from "../template/parameters/templateAggregation";
import TemplateChain from "../template/parameters/templateChain";
import PatternNode from "../pattern/nodes/patternNode";
import RegularNode, { RegularNodeBuilder } from "../pattern/nodes/regularNode";
import TemporaryAggregationNode from "../pattern/nodes/temporaryAggregationNode";
import Template from "../template/template";
import { Language } from "@puredit/language-config";

export default class NodeTransformVisitor {
  private cursor: AstCursor | undefined;
  private params: (TemplateParameter | string)[];
  private language: Language;

  constructor(template: Template) {
    this.params = template.params;
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
      return firstChild.toAggregationNode(patternNodeBuilder.type!, patternNodeBuilder.fieldName!);
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
        for (const allowedPattern of param.subPatterns) {
          const result = this.recursefindTemplateParameterBy(id, allowedPattern.params);
          if (result !== null) {
            return result;
          }
        }
        return null;
      }
      if (param instanceof TemplateChain) {
        let result = this.recursefindTemplateParameterBy(id, param.startPattern.params);
        if (result !== null) {
          return result;
        }
        for (const linkPattern of param.linkPatterns) {
          result = this.recursefindTemplateParameterBy(id, [...linkPattern.params]);
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
      this.cursor!.currentNode.type,
      this.cursor!.currentNode.text,
      this.cursor!.currentFieldName
    );
  }
}
