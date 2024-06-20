import AstCursor from "../ast/cursor";
import { TransformableTemplate } from "../template/template";
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
  AggStartTemplateTransformer,
  AggPartTemplateTransformer,
  ChainLinkTemplateTransformer,
  CompleteTemplateTransformer,
  Parser,
} from "./internal";
import AggregationNode from "../pattern/nodes/aggregationNode";
import CodeString from "../template/codeString";

export default abstract class TemplateTransformer {
  protected template!: TransformableTemplate;
  protected isExpression!: boolean;
  protected nodeTransformVisitor!: NodeTransformVisitor;

  constructor(protected readonly parser: Parser) {
    this.nodeTransformVisitor = new NodeTransformVisitor(this.parser.language);
  }

  setIsExpression(isExpression: boolean): TemplateTransformer {
    this.isExpression = isExpression;
    return this;
  }

  setTemplate(template: TransformableTemplate): TemplateTransformer {
    this.template = template;
    return this;
  }

  abstract execute(): Pattern;

  protected transformToPatternTree(codeString: CodeString): PatternNode {
    const cursor = new AstCursor(this.parser.parse(codeString.raw).walk());
    if (this.isExpression) {
      cursor.goToExpression();
    }
    const rootPatternNode = this.nodeTransformVisitor.transform(cursor, codeString)[0];
    if (rootPatternNode.isTopNode() && rootPatternNode.children) {
      return rootPatternNode.children[0].cutOff();
    }
    return rootPatternNode;
  }

  protected buildAggregationSubPatterns(pattern: Pattern): AggregationDecorator {
    const aggregationPatternMap: PatternsMap = {};
    const aggregationTypeMap: Record<string, string> = {};
    const startPatternMap: PatternMap = {};
    const aggregations = this.template.getAggregations();
    for (const aggregation of aggregations) {
      const aggregatedNodeType = this.getAggregatedNodeType(pattern, aggregation);
      const nodeTypeConfig = loadAggregatableNodeTypeConfigFor(
        this.parser.language,
        aggregatedNodeType
      );

      const aggregationPartPatternsTransformer = new AggPartTemplateTransformer(this.parser);
      if (aggregation.startTemplate) {
        aggregationPartPatternsTransformer.setStartTemplateCodeString(
          CodeString.fromTemplate(aggregation.startTemplate, this.parser.language)
        );
      }
      const aggregationSubPatterns = aggregation.partTemplates.map((subTemplate) => {
        if (subTemplate instanceof TransformableTemplate) {
          return aggregationPartPatternsTransformer
            .setNodeTypeConfig(nodeTypeConfig)
            .setIsExpression(false)
            .setTemplate(subTemplate)
            .execute();
        } else {
          return subTemplate.toPattern();
        }
      });
      aggregationPatternMap[aggregation.name] = aggregationSubPatterns;
      aggregationTypeMap[aggregation.name] = aggregatedNodeType;

      if (aggregation.startTemplate) {
        const aggregationStartTemplateTransformer = new AggStartTemplateTransformer(this.parser);
        const aggregationStartPattern = aggregationStartTemplateTransformer
          .setNodeTypeConfig(nodeTypeConfig)
          .setIsExpression(false)
          .setTemplate(aggregation.startTemplate)
          .execute();
        startPatternMap[aggregation.name] = aggregationStartPattern;
      }
    }
    const aggregationDecorator = new AggregationDecorator(
      pattern,
      aggregationPatternMap,
      startPatternMap,
      aggregationTypeMap
    );
    return aggregationDecorator;
  }

  private getAggregatedNodeType(pattern: Pattern, aggregation: TemplateAggregation): string {
    const aggregationCodeString = aggregation.toCodeString(this.parser.language);
    const aggregationPath = pattern.getPathToNodeWithText(aggregationCodeString);
    const patternCursor = new PatternCursor(pattern);
    patternCursor.follow(aggregationPath);
    const aggregationNode = patternCursor.currentNode as AggregationNode;
    return aggregationNode.astNodeType;
  }

  protected buildChainSubPatterns(pattern: Pattern): ChainDecorator {
    const startPatternMap: PatternMap = {};
    const linkPatternMap: PatternsMap = {};
    const chains = this.template.getChains();
    for (const chain of chains) {
      const startTemplateTransformer = new CompleteTemplateTransformer(this.parser);
      const startPattern = startTemplateTransformer
        .setIsExpression(true)
        .setTemplate(chain.startTemplate)
        .execute();

      const linkPatterns = chain.linkTemplates.map((linkTemplate) => {
        const linkTemplateTransformer = new ChainLinkTemplateTransformer(this.parser);
        return linkTemplateTransformer
          .setStartPatternRootNode(startPattern.rootNode)
          .setIsExpression(false)
          .setTemplate(linkTemplate)
          .execute();
      });
      startPatternMap[chain.name] = startPattern;
      linkPatternMap[chain.name] = linkPatterns;
    }
    const chainDecorator = new ChainDecorator(pattern, startPatternMap, linkPatternMap);
    return chainDecorator;
  }
}
