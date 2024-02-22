import { TreeSitterParser } from "../treeSitterParser";
import BasePattern from "../pattern/basePattern";
import Pattern from "../pattern/pattern";
import { Language } from "@puredit/language-config";
import { NodeTransformVisitor, PatternGeneration } from "./internal";

export default class CompletePatternGeneration extends PatternGeneration {
  constructor(parser: TreeSitterParser, targetLanguage: Language) {
    super(parser, targetLanguage);
  }

  execute(): Pattern {
    this.nodeTransformVisitor = new NodeTransformVisitor(
      this.targetLanguage!,
      this.rawTemplate!.params
    );

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
