import { TreeSitterParser } from "../treeSitterParser";
import BasePattern from "../pattern/basePattern";
import Pattern from "../pattern/pattern";
import { NodeTransformVisitor, PatternGeneration } from "./internal";

export default class CompletePatternGeneration extends PatternGeneration {
  constructor(parser: TreeSitterParser) {
    super(parser);
  }

  execute(): Pattern {
    this.nodeTransformVisitor = new NodeTransformVisitor(this.rawTemplate!);

    const codeString = this.rawTemplate!.toCodeString();
    const rootNode = this.transformToPatternTree(codeString);
    let pattern = new BasePattern(rootNode, this.rawTemplate!) as Pattern;

    if (this.rawTemplate!.hasAggregations()) {
      pattern = this.buildAggregationSubPatterns(pattern);
    }
    if (this.rawTemplate!.hasChains()) {
      pattern = this.buildChainSubPatterns(pattern);
    }

    return pattern;
  }
}
