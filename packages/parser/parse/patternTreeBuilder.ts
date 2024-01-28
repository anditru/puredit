import type { TreeSitterParser } from "../treeSitterParser";
import { isTopNode } from "../common";
import { type Context, type PatternNode } from "../types";
import { isString } from "@puredit/utils";
import { AstCursor } from "../astCursor";
import { NodeTransformVisitor } from "./nodeTransformVisitor";
import TemplateParameter from "../define/templateParameter";

export class PatternTreeBuilder {
  private template: TemplateStringsArray | undefined;
  private params: (string | TemplateParameter)[] | undefined;
  private isExpression: boolean | undefined;

  constructor(private readonly parser: TreeSitterParser | undefined) {}

  setTemplate(template: TemplateStringsArray): PatternTreeBuilder {
    this.template = template;
    return this;
  }

  setParams(params: (string | TemplateParameter)[]): PatternTreeBuilder {
    this.params = params;
    return this;
  }

  setIsExpression(isExpression: boolean): PatternTreeBuilder {
    this.isExpression = isExpression;
    return this;
  }

  build(): PatternNode {
    const codeString = this.buildCodeString();
    const draft = this.getDraftFunction();

    const cursor = new AstCursor(this.parser!.parse(codeString).walk());
    if (this.isExpression) {
      cursor.goToExpression();
    }

    const nodeTransformVisitor = new NodeTransformVisitor(this.params!);
    let rootPatternNode = nodeTransformVisitor.visit(cursor, codeString)[0];

    if (isTopNode(rootPatternNode) && rootPatternNode.children) {
      rootPatternNode = rootPatternNode.children[0];
    }
    return {
      ...rootPatternNode,
      draft,
    };
  }

  buildCodeString() {
    const substitutions = this.params!.map((param, index) => {
      if (isString(param)) {
        return param;
      } else {
        return param.toCodeString(index);
      }
    });

    return String.raw(this.template!, ...substitutions);
  }

  getDraftFunction() {
    // TODO: Implement draft generation considering Aggregation variants
    return (context: Context) => "Not implemented";
  }
}
