import type { TreeSitterParser } from "../treeSitterParser";
import { isTopNode } from "../common";
import { type Context, type PatternNode } from "../types";
import AstCursor from "../ast/cursor";
import { NodeTransformVisitor } from "./nodeTransformVisitor";
import RawTemplate from "../define/rawTemplate";

export class PatternTreeBuilder {
  private rawTemplate: RawTemplate | undefined;
  private isExpression: boolean | undefined;
  private nodeTransformVisitor: NodeTransformVisitor | undefined;

  constructor(private readonly parser: TreeSitterParser | undefined) {}

  setRawTemplate(rawTemplate: RawTemplate): PatternTreeBuilder {
    this.rawTemplate = rawTemplate;
    return this;
  }

  setIsExpression(isExpression: boolean): PatternTreeBuilder {
    this.isExpression = isExpression;
    return this;
  }

  build(): PatternNode {
    this.nodeTransformVisitor = new NodeTransformVisitor(
      this.rawTemplate!.params
    );

    let patternTree;
    if (!this.rawTemplate!.hasAggregations()) {
      const codeString = this.rawTemplate!.toCodeString();
      patternTree = this.transformToPatternTree(codeString);
    } else {
      throw new Error("Not implemented");
    }

    const draft = this.getDraftFunction();

    return {
      ...patternTree,
      draft,
    };
  }

  private transformToPatternTree(codeString: string): PatternNode {
    const cursor = new AstCursor(this.parser!.parse(codeString).walk());
    if (this.isExpression) {
      cursor.goToExpression();
    }

    const rootPatternNode = this.nodeTransformVisitor!.visit(
      cursor,
      codeString
    )[0];
    if (isTopNode(rootPatternNode) && rootPatternNode.children) {
      return rootPatternNode.children[0];
    }
    return rootPatternNode;
  }

  getDraftFunction() {
    // TODO: Implement draft generation considering Aggregation variants
    return (context: Context) => "Not implemented";
  }
}
