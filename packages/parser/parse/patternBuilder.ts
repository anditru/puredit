import { TreeSitterParser } from "../treeSitterParser";
import AstCursor from "../ast/cursor";
import { NodeTransformVisitor } from "./nodeTransformVisitor";
import RawTemplate from "../define/rawTemplate";
import PatternNode from "../pattern/nodes/patternNode";
import BasePattern from "../pattern/basePattern";
import Pattern from "../pattern/pattern";
import AggregationDecorator from "../pattern/decorators/aggregationDecorator";
import PatternCursor from "../pattern/cursor";
import { SubPatternMap } from "../pattern/types";
import ChainDecorator from "../pattern/decorators/chainDecorator";
import TreePath from "../cursor/treePath";
import ChainContinuationNode from "../pattern/nodes/chainContinuationNode";
import { Language } from "../config/types";
import { loadChainsConfigFor } from "../config/load";

export class PatternBuilder {
  private rawTemplate: RawTemplate | undefined;
  private isExpression: boolean | undefined;
  private targetLanguage: Language | undefined;
  private pathToChainContinuation: TreePath | undefined;
  private pathToCallRoot: TreePath | undefined;
  private nodeTransformVisitor: NodeTransformVisitor | undefined;

  constructor(private readonly parser: TreeSitterParser | undefined) {}

  setRawTemplate(rawTemplate: RawTemplate): PatternBuilder {
    this.rawTemplate = rawTemplate;
    return this;
  }

  setIsExpression(isExpression: boolean): PatternBuilder {
    this.isExpression = isExpression;
    return this;
  }

  setTargetLanguage(targetLanguage: Language) {
    this.targetLanguage = targetLanguage;

    const chainsConfig = loadChainsConfigFor(targetLanguage);
    this.pathToChainContinuation = chainsConfig.pathToNextChainLink;
    this.pathToCallRoot = chainsConfig.pathToCallRoot;

    return this;
  }

  build(): Pattern {
    this.nodeTransformVisitor = new NodeTransformVisitor(
      this.targetLanguage!,
      this.rawTemplate!.params
    );

    const rootNode = this.buildPatternTree();
    let pattern = new BasePattern(rootNode, this.rawTemplate!) as Pattern;

    if (this.rawTemplate!.hasAggregations()) {
      pattern = this.buildPatternWithAggregations(pattern);
    }

    if (this.rawTemplate!.hasChains()) {
      pattern = this.buildPatternWithChains(pattern);
    }

    return pattern;
  }

  private buildPatternTree(): PatternNode {
    const codeString = this.rawTemplate!.toCodeString();
    return this.transformToPatternTree(codeString);
  }

  private transformToPatternTree(codeString: string): PatternNode {
    const cursor = new AstCursor(this.parser!.parse(codeString).walk());
    if (this.isExpression) {
      cursor.goToExpression();
    }
    const rootPatternNode = this.nodeTransformVisitor!.visit(cursor)[0];
    if (rootPatternNode.isTopNode() && rootPatternNode.children) {
      return rootPatternNode.children[0].cutOff();
    }
    return rootPatternNode;
  }

  private buildPatternWithAggregations(pattern: Pattern): AggregationDecorator {
    const baseCodeString = this.rawTemplate!.toCodeString();
    const aggregationPatternMap = {} as SubPatternMap;
    const aggregations = this.rawTemplate!.getAggregations();

    for (const aggregation of aggregations) {
      const aggregationCodeString = aggregation.toCodeString();
      const partCodeStrings = aggregation.getCodeStringsForParts();
      const aggregationRootPath = pattern.getPathToNodeWithText(aggregationCodeString);

      const aggregationSubPatterns = partCodeStrings
        .map((partCodeString) => baseCodeString.replace(aggregationCodeString, partCodeString))
        .map((codeStringVariant) => this.transformToPatternTree(codeStringVariant))
        .map((patternTreeVariant, index: number) => {
          const patternTreeVariantCursor = new PatternCursor(patternTreeVariant);
          patternTreeVariantCursor.follow(aggregationRootPath);
          patternTreeVariantCursor.goToFirstChild();
          const subPatternRoot = patternTreeVariantCursor.currentNode;
          subPatternRoot.cutOff();
          return new BasePattern(subPatternRoot, aggregation.subPatterns[index]);
        });

      aggregationPatternMap[aggregation.name] = aggregationSubPatterns;
    }

    return new AggregationDecorator(pattern, aggregationPatternMap);
  }

  private buildPatternWithChains(pattern: Pattern): ChainDecorator {
    const startPatternMap = {} as Record<string, Pattern>;
    const linkPatternMap = {} as SubPatternMap;
    const chains = this.rawTemplate!.getChains();

    for (const chain of chains) {
      const startCodeString = chain.getCodeStringForChainStart();
      const startPatternRootNode = this.transformToPatternTree(startCodeString).children[0];
      startPatternMap[chain.name] = new BasePattern(startPatternRootNode, chain.startPattern);

      const linkCodeStrings = chain.getCodeStringsForChainLinks();
      const linkPatterns = linkCodeStrings
        .map((linkCodeString) => `${startCodeString}.${linkCodeString}`)
        .map((completeLinkCodeString) => this.transformToPatternTree(completeLinkCodeString))
        .map((linkRootNode, index) => {
          const linkPatternCursor = new PatternCursor(linkRootNode);
          const lastStep = this.pathToChainContinuation!.getLastStep();
          linkPatternCursor.follow(this.pathToChainContinuation!.getSliceBeforeLastStep());
          const chainContinuationNode = new ChainContinuationNode(
            this.targetLanguage!,
            startPatternRootNode,
            chain
          );
          linkPatternCursor.currentNode.insertChild(chainContinuationNode, lastStep);
          linkPatternCursor.reverseFollow(this.pathToChainContinuation!.getSliceBeforeLastStep());
          linkPatternCursor.follow(this.pathToCallRoot!);
          linkRootNode = linkPatternCursor.currentNode.cutOff();
          return new BasePattern(linkRootNode, chain.linkPatterns[index]);
        });
      linkPatternMap[chain.name] = linkPatterns;
    }

    return new ChainDecorator(pattern, startPatternMap, linkPatternMap);
  }
}
