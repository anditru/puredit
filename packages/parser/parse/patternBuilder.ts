import type { Target, TreeSitterParser } from "../treeSitterParser";
import AstCursor from "../ast/cursor";
import { NodeTransformVisitor } from "./nodeTransformVisitor";
import RawTemplate from "../define/rawTemplate";
import PatternNode from "../pattern/nodes/patternNode";
import BasePattern from "../pattern/basePattern";
import Pattern from "../pattern/pattern";
import AggregationDecorator from "../pattern/decorators/aggregationDecorator";
import PatternCursor from "../pattern/cursor";
import { SubPatternMap } from "../pattern/types";

export class PatternBuilder {
  private rawTemplate: RawTemplate | undefined;
  private isExpression: boolean | undefined;
  private targetLanguage: Target | undefined;
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

  setTargetLanguage(targetLanguage: Target) {
    this.targetLanguage = targetLanguage;
    return this;
  }

  build(): Pattern {
    this.nodeTransformVisitor = new NodeTransformVisitor(
      this.targetLanguage!,
      this.rawTemplate!.params
    );

    const rootNode = this.buildPatternTree();
    let pattern = new BasePattern(rootNode) as Pattern;

    if (this.rawTemplate!.hasAggregations()) {
      pattern = this.buildPatternWithAggregations(pattern);
    }

    return pattern;
  }

  private buildPatternTree(): PatternNode {
    const codeString = this.rawTemplate!.toCodeString();
    return this.transformToPatternTree(codeString);
  }

  private transformToPatternTree(codeString: string): PatternNode {
    const cursor = new AstCursor(this.parser!.parse(codeString).walk());
    if (this.isExpression) {
      cursor.goToExpression();
    }
    const rootPatternNode = this.nodeTransformVisitor!.visit(cursor)[0];
    if (rootPatternNode.isTopNode() && rootPatternNode.children) {
      return rootPatternNode.children[0].cutOff();
    }
    return rootPatternNode;
  }

  private buildPatternWithAggregations(pattern: Pattern): AggregationDecorator {
    const baseCodeString = this.rawTemplate!.toCodeString();
    const aggregationPatternMap = {} as SubPatternMap;
    const aggregations = this.rawTemplate!.getAggregations();

    for (const aggregation of aggregations) {
      const aggregationCodeString = aggregation.toCodeString();
      const partCodeStrings = aggregation.getCodeStringsForParts();
      const aggregationRootPath = pattern.getPathToNodeWithText(aggregationCodeString);

      const aggregationSubPatterns = partCodeStrings
        .map((partCodeString) => baseCodeString.replace(aggregationCodeString, partCodeString))
        .map((codeStringVariant) => this.transformToPatternTree(codeStringVariant))
        .map((patternTreeVariant) => {
          const patternTreeVariantCursor = new PatternCursor(patternTreeVariant);
          patternTreeVariantCursor.follow(aggregationRootPath);
          patternTreeVariantCursor.goToFirstChild();
          const subPatternRoot = patternTreeVariantCursor.currentNode;
          subPatternRoot.cutOff();
          return new BasePattern(subPatternRoot);
        });

      aggregationPatternMap[aggregation.name] = aggregationSubPatterns;
    }

    return new AggregationDecorator(pattern, aggregationPatternMap);
  }
}
