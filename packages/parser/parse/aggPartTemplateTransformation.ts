import { TreeSitterParser } from "../tree-sitter/treeSitterParser";
import BasePattern from "../pattern/basePattern";
import Pattern from "../pattern/pattern";
import PatternCursor from "../pattern/cursor";
import PatternNode from "../pattern/nodes/patternNode";
import {
  AggregatableNodeTypeConfig,
  aggregationStartPlaceHolder,
  aggregationPlaceHolder,
} from "@puredit/language-config";
import { TemplateTransformation, NodeTransformVisitor } from "./internal";
import CodeString from "../template/codeString";

export default class AggPartTemplateTransformation extends TemplateTransformation {
  private nodeTypeConfig: AggregatableNodeTypeConfig | undefined;
  private startTemplateCodeString: CodeString | undefined;

  constructor(parser: TreeSitterParser) {
    super(parser);
  }

  setNodeTypeConfig(nodeTypeConfig: AggregatableNodeTypeConfig): AggPartTemplateTransformation {
    this.nodeTypeConfig = nodeTypeConfig;
    return this;
  }

  setStartTemplateCodeString(codeString: CodeString) {
    this.startTemplateCodeString = codeString;
    return this;
  }

  execute(): Pattern {
    this.nodeTransformVisitor = new NodeTransformVisitor();

    const codeString = this.buildCodeString();
    const rootNode = this.transformToPatternTree(codeString);
    let pattern = this.extractAggPartPattern(rootNode) as Pattern;

    if (this.template!.hasAggregations()) {
      pattern = this.buildAggregationSubPatterns(pattern);
    }
    if (this.template!.hasChains()) {
      pattern = this.buildChainSubPatterns(pattern);
    }

    return pattern;
  }

  private buildCodeString(): CodeString {
    const contextTemplate = new CodeString(this.nodeTypeConfig!.contextTemplate);
    const partCodeString = this.template!.toCodeString();
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
    return new BasePattern(subPatternRoot, this.template!);
  }

  private getAggregationStartPath() {
    const contextTemplate = this.nodeTypeConfig!.contextTemplate;
    const contextTemplateTree = this.transformToPatternTree(new CodeString(contextTemplate));
    const contextTemplatePattern = new BasePattern(
      contextTemplateTree,
      this.template! // TODO: Find a more sensible template to pass here
    );
    return contextTemplatePattern.getPathToNodeWithText(aggregationPlaceHolder);
  }
}
