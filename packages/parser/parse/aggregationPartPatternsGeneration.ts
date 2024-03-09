import { TreeSitterParser } from "../treeSitterParser";
import BasePattern from "../pattern/basePattern";
import Pattern from "../pattern/pattern";
import PatternCursor from "../pattern/cursor";
import PatternNode from "../pattern/nodes/patternNode";
import { AggregatableNodeTypeConfig, aggregationPlaceHolder } from "@puredit/language-config";
import { PatternGeneration, NodeTransformVisitor } from "./internal";
import CodeString from "../template/codeString";

export default class AggregationPartPatternsGeneration extends PatternGeneration {
  private nodeTypeConfig: AggregatableNodeTypeConfig | undefined;

  constructor(parser: TreeSitterParser) {
    super(parser);
  }

  setNodeTypeConfig(nodeTypeConfig: AggregatableNodeTypeConfig): AggregationPartPatternsGeneration {
    this.nodeTypeConfig = nodeTypeConfig;
    return this;
  }

  execute(): Pattern {
    this.nodeTransformVisitor = new NodeTransformVisitor();

    const codeString = this.buildCodeString();
    const rootNode = this.transformToPatternTree(codeString);
    let pattern = this.extractAggregationPattern(rootNode) as Pattern;

    if (this.template!.hasAggregations()) {
      pattern = this.buildAggregationSubPatterns(pattern);
    }
    if (this.template!.hasChains()) {
      pattern = this.buildChainSubPatterns(pattern);
    }

    return pattern;
  }

  private buildCodeString(): CodeString {
    const contextTemplate = this.nodeTypeConfig!.contextTemplate;
    const partCodeString = this.template!.toCodeString();
    return partCodeString.insertInto(contextTemplate, aggregationPlaceHolder);
  }

  private extractAggregationPattern(patternTreeRoot: PatternNode) {
    const patternTreeCursor = new PatternCursor(patternTreeRoot);
    const aggregationRootPath = this.getAggregationRootPath();
    patternTreeCursor.follow(aggregationRootPath);
    const subPatternRoot = patternTreeCursor.currentNode;
    subPatternRoot.cutOff();
    return new BasePattern(subPatternRoot, this.template!);
  }

  private getAggregationRootPath() {
    const contextTemplate = this.nodeTypeConfig!.contextTemplate;
    const contextTemplateTree = this.transformToPatternTree(new CodeString(contextTemplate));
    const contextTemplatePattern = new BasePattern(
      contextTemplateTree,
      this.template! // TODO: Find a more sensible template to pass here
    );
    return contextTemplatePattern.getPathToNodeWithText(aggregationPlaceHolder);
  }
}
