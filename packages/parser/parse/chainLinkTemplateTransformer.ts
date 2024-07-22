import PatternNode from "../pattern/nodes/patternNode";
import BasePattern from "../pattern/basePattern";
import Pattern from "../pattern/pattern";
import PatternCursor from "../pattern/cursor";
import { ChainsConfig } from "@puredit/language-config";
import { loadChainableNodeTypeConfigFor, loadChainsConfigFor } from "@puredit/language-config";
import { Parser, TemplateTransformer } from "./internal";
import ChainContinuationNode from "../pattern/nodes/chainContinuationNode";
import CodeString from "../template/codeString";

/**
 * @class
 * Contains the logic to transform an chain link template into a pattern
 * by wrapping it into the correct surrounding code, parsing it with Tree-sitter
 * and transforming the resulting sytax tree into a pattern.
 */
export default class ChainLinkTemplateTransformer extends TemplateTransformer {
  private chainsConfig!: ChainsConfig;
  private startPatternRootNode!: PatternNode;

  constructor(parser: Parser) {
    super(parser);
  }

  setStartPatternRootNode(startPatternRootNode: PatternNode): ChainLinkTemplateTransformer {
    this.startPatternRootNode = startPatternRootNode;
    return this;
  }

  execute(): Pattern {
    this.chainsConfig = loadChainsConfigFor(this.parser.language);

    const codeString = this.buildCodeString();
    const rootNode = this.transformToPatternTree(codeString);
    let pattern = this.extractChainLinkPattern(rootNode) as Pattern;

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
    const linkCodeString = CodeString.fromTemplate(this.template, this.parser.language);
    return linkCodeString.insertInto("a.<link>", "<link>");
  }

  private extractChainLinkPattern(linkCallRoot: PatternNode): BasePattern {
    const linkPatternCursor = new PatternCursor(linkCallRoot);

    linkPatternCursor.follow(this.chainsConfig.pathToFirstLink);
    const chainableNodeTypeConfig = loadChainableNodeTypeConfigFor(
      this.parser.language,
      linkPatternCursor.currentNode.type
    );

    const pathToNextChainLink = chainableNodeTypeConfig.pathToNextLink;
    const lastStep = pathToNextChainLink.getLastStep();

    linkPatternCursor.follow(pathToNextChainLink.getSliceBeforeLastStep());
    const chainContinuationNode = new ChainContinuationNode(
      this.parser.language,
      this.startPatternRootNode
    );
    linkPatternCursor.currentNode.insertChild(chainContinuationNode, lastStep);
    linkPatternCursor.reverseFollow(pathToNextChainLink.getSliceBeforeLastStep());

    const linkRootNode = linkPatternCursor.currentNode.cutOff();
    return new BasePattern(this.template.name, this.parser.language, linkRootNode);
  }
}
