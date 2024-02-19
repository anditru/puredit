import { TreeSitterParser } from "../treeSitterParser";
import BasePattern from "../pattern/basePattern";
import Pattern from "../pattern/pattern";
import PatternCursor from "../pattern/cursor";
import PatternNode from "../pattern/nodes/patternNode";
import { AggregatableNodeTypeConfig, Language, aggregationPlaceHolder } from "../config/types";
import { PatternGeneration, NodeTransformVisitor } from "./internal";

export default class AggregationPatternsGeneration extends PatternGeneration {
  private nodeTypeConfig: AggregatableNodeTypeConfig | undefined;

  constructor(parser: TreeSitterParser, targetLanguage: Language) {
    super(parser, targetLanguage);
  }

  setNodeTypeConfig(nodeTypeConfig: AggregatableNodeTypeConfig): AggregationPatternsGeneration {
    this.nodeTypeConfig = nodeTypeConfig;
    return this;
  }

  execute(): Pattern {
    this.nodeTransformVisitor = new NodeTransformVisitor(
      this.targetLanguage!,
      this.rawTemplate!.params
    );

    const codeString = this.buildCodeString();
    const rootNode = this.transformToPatternTree(codeString);
    let pattern = this.extractAggregationPattern(rootNode) as Pattern;

    if (this.rawTemplate!.hasAggregations()) {
      pattern = this.buildAggregationSubPatterns(pattern);
    }
    if (this.rawTemplate!.hasChains()) {
      pattern = this.buildChainSubPatterns(pattern);
    }

    return pattern;
  }

  private buildCodeString(): string {
    const contextTemplate = this.nodeTypeConfig!.contextTemplate;
    const partCodeString = this.rawTemplate!.toCodeString();
    return contextTemplate.replace(aggregationPlaceHolder, partCodeString);
  }

  private extractAggregationPattern(patternTreeRoot: PatternNode) {
    const patternTreeCursor = new PatternCursor(patternTreeRoot);
    const aggregationRootPath = this.getAggregationRootPath();
    patternTreeCursor.follow(aggregationRootPath);
    const subPatternRoot = patternTreeCursor.currentNode;
    subPatternRoot.cutOff();
    return new BasePattern(subPatternRoot, this.rawTemplate!);
  }

  private getAggregationRootPath() {
    const contextTemplate = this.nodeTypeConfig!.contextTemplate;
    const contextTemplateTree = this.transformToPatternTree(contextTemplate);
    const contextTemplatePattern = new BasePattern(
      contextTemplateTree,
      this.rawTemplate! // TODO: Find a more sensible template to pass here
    );
    return contextTemplatePattern.getPathToNodeWithText(aggregationPlaceHolder);
  }
}
