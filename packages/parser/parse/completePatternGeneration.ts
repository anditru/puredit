import { TreeSitterParser } from "../treeSitterParser";
import BasePattern from "../pattern/basePattern";
import Pattern from "../pattern/pattern";
import { NodeTransformVisitor, PatternGeneration } from "./internal";

export default class CompletePatternGeneration extends PatternGeneration {
  constructor(parser: TreeSitterParser) {
    super(parser);
  }

  execute(): Pattern {
    this.nodeTransformVisitor = new NodeTransformVisitor();

    const codeString = this.template!.toCodeString();
    const rootNode = this.transformToPatternTree(codeString);
    let pattern = new BasePattern(rootNode, this.template!) as Pattern;

    if (this.template!.hasAggregations()) {
      pattern = this.buildAggregationSubPatterns(pattern);
    }
    if (this.template!.hasChains()) {
      pattern = this.buildChainSubPatterns(pattern);
    }

    return pattern;
  }
}
