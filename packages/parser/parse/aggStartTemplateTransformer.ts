import BasePattern from "../pattern/basePattern";
import Pattern from "../pattern/pattern";
import PatternCursor from "../pattern/cursor";
import PatternNode from "../pattern/nodes/patternNode";
import { AggregatableNodeTypeConfig, aggregationStartPlaceHolder } from "@puredit/language-config";
import { TemplateTransformer, Parser } from "./internal";
import CodeString from "../template/codeString";

export default class AggStartTemplateTransformer extends TemplateTransformer {
  private nodeTypeConfig!: AggregatableNodeTypeConfig;

  constructor(parser: Parser) {
    super(parser);
  }

  setNodeTypeConfig(nodeTypeConfig: AggregatableNodeTypeConfig): AggStartTemplateTransformer {
    this.nodeTypeConfig = nodeTypeConfig;
    return this;
  }

  execute(): Pattern {
    const codeString = this.buildCodeString();
    const rootNode = this.transformToPatternTree(codeString);
    let pattern = this.extractAggStartPattern(rootNode) as Pattern;

    if (this.template.hasAggregations()) {
      pattern = this.buildAggregationSubPatterns(pattern);
      rootNode.assignToPattern(pattern);
    }
    if (this.template.hasChains()) {
      pattern = this.buildChainSubPatterns(pattern);
      rootNode.assignToPattern(pattern);
    }

    return pattern;
  }

  private buildCodeString(): CodeString {
    const contextTemplate = new CodeString(this.nodeTypeConfig.contextTemplate);
    const startCodeString = CodeString.fromTemplate(this.template, this.parser.language);
    return contextTemplate.replace(aggregationStartPlaceHolder, startCodeString);
  }

  private extractAggStartPattern(patternTreeRoot: PatternNode) {
    const patternTreeCursor = new PatternCursor(patternTreeRoot);
    const aggregationStartPath = this.getAggregationStartPath();
    patternTreeCursor.follow(aggregationStartPath);
    const startPatternRoot = patternTreeCursor.currentNode;
    startPatternRoot.cutOff();
    startPatternRoot.fieldName = undefined;
    return new BasePattern(this.template.name, this.parser.language, startPatternRoot);
  }

  private getAggregationStartPath() {
    const contextTemplate = this.nodeTypeConfig.contextTemplate;
    const contextTemplateRoot = this.transformToPatternTree(new CodeString(contextTemplate));
    const contextTemplatePattern = new BasePattern(
      "helperTemplateToDetermineStartPath",
      this.parser.language,
      contextTemplateRoot
    );
    return contextTemplatePattern.getPathToNodeWithText(aggregationStartPlaceHolder);
  }
}
