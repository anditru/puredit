import type { TreeSitterParser } from "../treeSitterParser";
import AstCursor from "../ast/cursor";
import { NodeTransformVisitor } from "./nodeTransformVisitor";
import RawTemplate from "../define/rawTemplate";
import PatternNode from "../pattern/patternNode";
import Pattern from "../pattern/pattern";

export class PatternBuilder {
  private rawTemplate: RawTemplate | undefined;
  private isExpression: boolean | undefined;
  private nodeTransformVisitor: NodeTransformVisitor | undefined;

  constructor(private readonly parser: TreeSitterParser | undefined) {}

  setRawTemplate(rawTemplate: RawTemplate): PatternBuilder {
    this.rawTemplate = rawTemplate;
    return this;
  }

  setIsExpression(isExpression: boolean): PatternBuilder {
    this.isExpression = isExpression;
    return this;
  }

  build(): Pattern {
    this.nodeTransformVisitor = new NodeTransformVisitor(
      this.rawTemplate!.params
    );

    const codeString = this.rawTemplate!.toCodeString();
    const rootNode = this.transformToPatternTree(codeString);

    return new Pattern(rootNode);
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
    if (rootPatternNode.isTopNode() && rootPatternNode.children) {
      return rootPatternNode.children[0];
    }
    return rootPatternNode;
  }
}
