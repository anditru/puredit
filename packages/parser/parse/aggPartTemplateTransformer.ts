import BasePattern from "../pattern/basePattern";
import Pattern from "../pattern/pattern";
import PatternCursor from "../pattern/cursor";
import PatternNode from "../pattern/nodes/patternNode";
import {
  AggregatableNodeTypeConfig,
  aggregationStartPlaceHolder,
  aggregationPlaceHolder,
} from "@puredit/language-config";
import { TemplateTransformer, Parser } from "./internal";
import CodeString from "../template/codeString";

export default class AggPartTemplateTransformer extends TemplateTransformer {
  private nodeTypeConfig: AggregatableNodeTypeConfig | undefined;
  private startTemplateCodeString: CodeString | undefined;

  constructor(parser: Parser) {
    super(parser);
  }

  setNodeTypeConfig(nodeTypeConfig: AggregatableNodeTypeConfig): AggPartTemplateTransformer {
    this.nodeTypeConfig = nodeTypeConfig;
    return this;
  }

  setStartTemplateCodeString(codeString: CodeString) {
    this.startTemplateCodeString = codeString;
    return this;
  }

  execute(): Pattern {
    const codeString = this.buildCodeString();
    const rootNode = this.transformToPatternTree(codeString);
    let pattern = this.extractAggPartPattern(rootNode) as Pattern;

    if (this.template!.hasAggregations()) {
      pattern = this.buildAggregationSubPatterns(pattern);
      rootNode.assignToPattern(pattern);
    }
    if (this.template!.hasChains()) {
      pattern = this.buildChainSubPatterns(pattern);
      rootNode.assignToPattern(pattern);
    }

    return pattern;
  }

  private buildCodeString(): CodeString {
    const contextTemplate = new CodeString(this.nodeTypeConfig!.contextTemplate);
    const partCodeString = CodeString.fromTemplate(this.template, this.parser.language);
    if (this.startTemplateCodeString) {
      contextTemplate.replace(aggregationStartPlaceHolder, this.startTemplateCodeString);
    }
    return contextTemplate.replace(aggregationPlaceHolder, partCodeString);
  }

  private extractAggPartPattern(patternTreeRoot: PatternNode) {
    const patternTreeCursor = new PatternCursor(patternTreeRoot);
    const aggregationStartPath = this.getAggregationStartPath();
    patternTreeCursor.follow(aggregationStartPath);
    const subPatternRoot = patternTreeCursor.currentNode;
    subPatternRoot.cutOff();
    subPatternRoot.fieldName = undefined;
    return new BasePattern(this.template.name, this.parser.language, subPatternRoot);
  }

  private getAggregationStartPath() {
    const contextTemplate = this.nodeTypeConfig!.contextTemplate;
    const contextTemplateRoot = this.transformToPatternTree(new CodeString(contextTemplate));
    const contextTemplatePattern = new BasePattern(
      "helperTemplateToDetermineStartPath",
      this.parser.language,
      contextTemplateRoot
    );
    return contextTemplatePattern.getPathToNodeWithText(aggregationPlaceHolder);
  }
}
