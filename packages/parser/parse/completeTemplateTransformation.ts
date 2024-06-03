import BasePattern from "../pattern/basePattern";
import Pattern from "../pattern/pattern";
import { Parser, TemplateTransformation } from "./internal";

export default class CompleteTemplateTransformation extends TemplateTransformation {
  constructor(parser: Parser) {
    super(parser);
  }

  execute(): Pattern {
    const codeString = this.template.toCodeString(this.parser.language);
    const rootNode = this.transformToPatternTree(codeString);
    let pattern = new BasePattern(this.template.name, this.parser.language, rootNode) as Pattern;

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
}
