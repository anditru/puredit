import BasePattern from "../pattern/basePattern";
import Pattern from "../pattern/pattern";
import CodeString from "../template/codeString";
import { Parser, TemplateTransformer } from "./internal";

/**
 * @class
 * Contains the algorithm to transform a template that can be transformed without
 * the context of the surrounding code, i.e., chain start templates and
 * the templates of root projections.
 */
export default class CompleteTemplateTransformer extends TemplateTransformer {
  constructor(parser: Parser) {
    super(parser);
  }

  execute(): Pattern {
    const codeString = CodeString.fromTemplate(this.template, this.parser.language);
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
