import { TreeSitterParser } from "../treeSitterParser";
import AstCursor from "../ast/cursor";
import RawTemplate from "../define/rawTemplate";
import TemplateAggregation from "../define/templateAggregation";
import PatternNode from "../pattern/nodes/patternNode";
import Pattern from "../pattern/pattern";
import AggregationDecorator from "../pattern/decorators/aggregationDecorator";
import ChainDecorator from "../pattern/decorators/chainDecorator";
import PatternCursor from "../pattern/cursor";
import { PatternMap, PatternsMap } from "../match/types";
import { Language } from "@puredit/language-config";
import { loadAggregatableNodeTypeConfigFor } from "@puredit/language-config";
import {
  NodeTransformVisitor,
  AggregationPatternsGeneration,
  ChainLinkPatternsGeneration,
  CompletePatternGeneration,
} from "./internal";
import AggregationNode from "../pattern/nodes/aggregationNode";

export default abstract class PatternGeneration {
  protected rawTemplate: RawTemplate | undefined;
  protected isExpression: boolean | undefined;
  protected nodeTransformVisitor: NodeTransformVisitor | undefined;

  constructor(protected readonly parser: TreeSitterParser) {}

  setIsExpression(isExpression: boolean): PatternGeneration {
    this.isExpression = isExpression;
    return this;
  }

  setRawTemplate(rawTemplate: RawTemplate): PatternGeneration {
    this.rawTemplate = rawTemplate;
    return this;
  }

  abstract execute(): Pattern;

  protected transformToPatternTree(codeString: string): PatternNode {
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

  protected buildAggregationSubPatterns(pattern: Pattern): AggregationDecorator {
    const aggregationPatternMap: PatternsMap = {};
    const aggregations = this.rawTemplate!.getAggregations();
    for (const aggregation of aggregations) {
      const aggregatedNodeType = this.getAggregatedNodeType(pattern, aggregation);
      const nodeTypeConfig = loadAggregatableNodeTypeConfigFor(
        this.rawTemplate!.language,
        aggregatedNodeType
      );
      const aggregationSubPatterns = aggregation.subPatterns.map((subTemplate) => {
        const aggregationPatternsGeneration = new AggregationPatternsGeneration(this.parser);
        return aggregationPatternsGeneration
          .setNodeTypeConfig(nodeTypeConfig)
          .setIsExpression(false)
          .setRawTemplate(subTemplate)
          .execute();
      });
      aggregationPatternMap[aggregation.name] = aggregationSubPatterns;
    }
    return new AggregationDecorator(pattern, aggregationPatternMap);
  }

  private getAggregatedNodeType(pattern: Pattern, aggregation: TemplateAggregation): string {
    const aggregationCodeString = aggregation.toCodeString();
    const aggregationPath = pattern.getPathToNodeWithText(aggregationCodeString);
    const patternCursor = new PatternCursor(pattern);
    patternCursor.follow(aggregationPath.getSliceBeforeLastStep());
    const aggregationNode = patternCursor.currentNode as AggregationNode;
    return aggregationNode.astNodeType;
  }

  protected buildChainSubPatterns(pattern: Pattern): ChainDecorator {
    const startPatternMap: PatternMap = {};
    const linkPatternMap: PatternsMap = {};
    const chains = this.rawTemplate!.getChains();
    for (const chain of chains) {
      const startPatternGeneration = new CompletePatternGeneration(this.parser);
      const startPattern = startPatternGeneration
        .setIsExpression(true)
        .setRawTemplate(chain.startPattern)
        .execute();

      const linkPatterns = chain.linkPatterns.map((linkTemplate) => {
        const linkPatternGeneration = new ChainLinkPatternsGeneration(this.parser);
        return linkPatternGeneration
          .setTemplateChain(chain)
          .setStartPatternRootNode(startPattern.rootNode)
          .setIsExpression(false)
          .setRawTemplate(linkTemplate)
          .execute();
      });
      startPatternMap[chain.name] = startPattern;
      linkPatternMap[chain.name] = linkPatterns;
    }
    return new ChainDecorator(pattern, startPatternMap, linkPatternMap);
  }
}
