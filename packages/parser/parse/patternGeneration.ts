import { TreeSitterParser } from "../treeSitterParser";
import AstCursor from "../ast/cursor";
import Template from "../template/template";
import TemplateAggregation from "../template/parameters/templateAggregation";
import PatternNode from "../pattern/nodes/patternNode";
import Pattern from "../pattern/pattern";
import AggregationDecorator from "../pattern/decorators/aggregationDecorator";
import ChainDecorator from "../pattern/decorators/chainDecorator";
import PatternCursor from "../pattern/cursor";
import { PatternMap, PatternsMap } from "../match/types";
import { loadAggregatableNodeTypeConfigFor } from "@puredit/language-config";
import {
  NodeTransformVisitor,
  AggregationPatternsGeneration,
  ChainLinkPatternsGeneration,
  CompletePatternGeneration,
} from "./internal";
import AggregationNode from "../pattern/nodes/aggregationNode";
import CodeString from "../template/codeString";

export default abstract class PatternGeneration {
  protected template: Template | undefined;
  protected isExpression: boolean | undefined;
  protected nodeTransformVisitor: NodeTransformVisitor | undefined;

  constructor(protected readonly parser: TreeSitterParser) {}

  setIsExpression(isExpression: boolean): PatternGeneration {
    this.isExpression = isExpression;
    return this;
  }

  setTemplate(template: Template): PatternGeneration {
    this.template = template;
    return this;
  }

  abstract execute(): Pattern;

  protected transformToPatternTree(codeString: CodeString): PatternNode {
    const cursor = new AstCursor(this.parser!.parse(codeString.raw).walk());
    if (this.isExpression) {
      cursor.goToExpression();
    }
    const rootPatternNode = this.nodeTransformVisitor!.visit(cursor, codeString)[0];
    if (rootPatternNode.isTopNode() && rootPatternNode.children) {
      return rootPatternNode.children[0].cutOff();
    }
    return rootPatternNode;
  }

  protected buildAggregationSubPatterns(pattern: Pattern): AggregationDecorator {
    const aggregationPatternMap: PatternsMap = {};
    const aggregationTypeMap: Record<string, string> = {};
    const aggregations = this.template!.getAggregations();
    for (const aggregation of aggregations) {
      const aggregatedNodeType = this.getAggregatedNodeType(pattern, aggregation);
      const nodeTypeConfig = loadAggregatableNodeTypeConfigFor(
        this.template!.language,
        aggregatedNodeType
      );
      const aggregationSubPatterns = aggregation.subPatterns.map((subTemplate) => {
        const aggregationPatternsGeneration = new AggregationPatternsGeneration(this.parser);
        return aggregationPatternsGeneration
          .setNodeTypeConfig(nodeTypeConfig)
          .setIsExpression(false)
          .setTemplate(subTemplate)
          .execute();
      });
      aggregationPatternMap[aggregation.name] = aggregationSubPatterns;
      aggregationTypeMap[aggregation.name] = aggregatedNodeType;
    }
    return new AggregationDecorator(pattern, aggregationPatternMap, aggregationTypeMap);
  }

  private getAggregatedNodeType(pattern: Pattern, aggregation: TemplateAggregation): string {
    const aggregationCodeString = aggregation.toCodeString();
    const aggregationPath = pattern.getPathToNodeWithText(aggregationCodeString);
    const patternCursor = new PatternCursor(pattern);
    patternCursor.follow(aggregationPath);
    const aggregationNode = patternCursor.currentNode as AggregationNode;
    return aggregationNode.astNodeType;
  }

  protected buildChainSubPatterns(pattern: Pattern): ChainDecorator {
    const startPatternMap: PatternMap = {};
    const linkPatternMap: PatternsMap = {};
    const chains = this.template!.getChains();
    for (const chain of chains) {
      const startPatternGeneration = new CompletePatternGeneration(this.parser);
      const startPattern = startPatternGeneration
        .setIsExpression(true)
        .setTemplate(chain.startPattern)
        .execute();

      const linkPatterns = chain.linkPatterns.map((linkTemplate) => {
        const linkPatternGeneration = new ChainLinkPatternsGeneration(this.parser);
        return linkPatternGeneration
          .setTemplateChain(chain)
          .setStartPatternRootNode(startPattern.rootNode)
          .setIsExpression(false)
          .setTemplate(linkTemplate)
          .execute();
      });
      startPatternMap[chain.name] = startPattern;
      linkPatternMap[chain.name] = linkPatterns;
    }
    return new ChainDecorator(pattern, startPatternMap, linkPatternMap);
  }
}
