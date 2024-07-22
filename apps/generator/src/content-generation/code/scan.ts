import { PatternCursor, PatternNode } from "../pattern";
import { Language } from "../common";
import {
  ChainableNodeTypeConfig,
  loadAggregatableNodeTypeConfigFor,
  loadAggregatableNodeTypesFor,
  loadBlocksConfigFor,
  loadChainableNodeTypeConfigFor,
  loadChainableNodeTypesFor,
} from "@puredit/language-config";
import { BlockVariableMap, Path } from "../context-var-detection/blockVariableMap";
import AstCursor from "@puredit/parser/ast/cursor";
import TemplateParameterArray from "../template/parameterArray";
import TemplateArgument from "../template/argument";
import TemplateBlock from "../template/block";
import { TemplateChain, ChainStart, ChainLink } from "../template/chain";
import { TreePath } from "@puredit/parser";
import { AggregationPart, TemplateAggregation } from "../template/aggregation";
import AstNode from "@puredit/parser/ast/node";

export interface CodeScanResult {
  pattern: PatternNode;
  templateParameters: TemplateParameterArray;
}

export async function scanCode(
  samples: AstNode[],
  language: Language,
  undeclaredVariableMap: BlockVariableMap,
  ignoreBlocks: boolean
): Promise<CodeScanResult> {
  let nodes: PatternNode[] = [];
  let templateParameters = new TemplateParameterArray();
  let cursor: AstCursor | PatternCursor = samples[0].walk();

  for (let i = 1; i < samples.length; i++) {
    const nodeComparison = new NodeComparison(
      cursor,
      samples[i].walk(),
      language,
      undeclaredVariableMap,
      true
    );
    [nodes, templateParameters] = nodeComparison.execute(ignoreBlocks);
    cursor = new PatternCursor(nodes[0]);
  }

  return { pattern: nodes[0], templateParameters };
}

class NodeComparison {
  // Input
  private ignoreBlocks = false;
  private blockNodeType: string;
  private chainableNodeTypes: string[];
  private aggregatableNodeTypes: string[];

  // State
  private path: Path;
  private inChain = false;

  // Output
  private nodes: PatternNode[] = [];
  private templateParameters = new TemplateParameterArray();

  constructor(
    private a: AstCursor | PatternCursor,
    private b: AstCursor | PatternCursor,
    private language: Language,
    private undeclaredVariables: BlockVariableMap,
    private initial: boolean = false
  ) {
    this.blockNodeType = loadBlocksConfigFor(this.language).blockNodeType;
    this.chainableNodeTypes = loadChainableNodeTypesFor(this.language);
    this.aggregatableNodeTypes = loadAggregatableNodeTypesFor(this.language);
  }

  execute(
    ignoreBlocks: boolean,
    path: Path = [],
    inChain = false
  ): [PatternNode[], TemplateParameterArray] | null {
    this.ignoreBlocks = ignoreBlocks;
    this.path = path;
    this.inChain = inChain;
    let hasSibling = true;

    for (let index = 0; hasSibling; index++) {
      if (this.parentMissmatch()) {
        return null;
      }
      if (!this.inChain && this.nodesAreChainable()) {
        const templateChain = this.extractTemplateChain(index);
        if (templateChain) {
          this.recordChain(templateChain);
          this.inChain = true;
        }
      }
      if (this.nodesAreAggregatable() && this.atLeastOneAggPart()) {
        const templateAggregation = this.extractTemplateAggregation(index);
        if (templateAggregation) {
          this.recordAggregation(templateAggregation);
        }
      }
      if (this.typeMissmatch()) {
        if (this.atLeastOneNodeIsKeyword()) {
          return null; // keywords cannot be variable
        }
        this.recordVariableWithWildcard(index);
      } else if (!this.ignoreBlocks && this.nodesAreBlock()) {
        this.recordBlock(index);
      } else {
        this.compareChildren(index);
      }

      const hasSiblingA = this.a.goToNextSibling();
      const hasSiblingB = this.b.goToNextSibling();
      this.inChain = false;
      if (hasSiblingA !== hasSiblingB) {
        return null; // mismatch (parent)
      }
      hasSibling = hasSiblingA && hasSiblingB;
    }

    return [this.nodes, this.templateParameters];
  }

  private compareChildren(index: number) {
    const hasChildrenA = this.a.goToFirstChild();
    const hasChildrenB = this.b.goToFirstChild();
    if (hasChildrenA !== hasChildrenB) {
      if (hasChildrenA) {
        this.a.goToParent();
      }
      if (hasChildrenB) {
        this.b.goToParent();
      }
      this.recordTemplate(index);
    } else if (hasChildrenA && hasChildrenB) {
      this.executeChildNodeComparison(index);
    } else if (this.a.currentNode.text !== this.b.currentNode.text) {
      this.recordTemplate(index);
    } else {
      this.nodes.push({
        fieldName: this.a.currentFieldName || undefined,
        type: this.a.currentNode.type,
        text: this.a.currentNode.text,
      });
    }
  }

  private executeChildNodeComparison(index: number) {
    const childNodeComparison = new NodeComparison(
      this.a,
      this.b,
      this.language,
      this.undeclaredVariables
    );
    const path = this.initial ? [] : this.path.concat(index);
    const result = childNodeComparison.execute(this.ignoreBlocks, path, this.inChain);
    this.a.goToParent();
    this.b.goToParent();
    if (result) {
      const [childNodes, childTemplateParameters] = result;
      this.templateParameters = this.templateParameters.concat(
        childTemplateParameters
      ) as TemplateParameterArray;
      this.nodes.push({
        fieldName: this.a.currentFieldName || undefined,
        type: this.a.currentNode.type,
        children: childNodes,
      });
    } else if (!result && this.nodesAreBlock()) {
      this.recordBlock(index);
    } else {
      this.recordTemplate(index);
    }
  }

  private parentMissmatch(): boolean {
    return this.a.currentFieldName !== this.b.currentFieldName;
  }

  private typeMissmatch(): boolean {
    return this.a.currentNode.type !== this.b.currentNode.type;
  }

  private atLeastOneNodeIsKeyword(): boolean {
    return !this.a.nodeIsNamed || !this.b.nodeIsNamed;
  }

  private nodesAreBlock(): boolean {
    return (
      this.a.currentNode.type === this.blockNodeType &&
      this.b.currentNode.type === this.blockNodeType
    );
  }

  private nodesAreChainable(): boolean {
    return (
      this.chainableNodeTypes.includes(this.a.currentNode.type) &&
      this.chainableNodeTypes.includes(this.b.currentNode.type)
    );
  }

  private nodesAreAggregatable(): boolean {
    return (
      this.aggregatableNodeTypes.includes(this.a.currentNode.type) &&
      this.aggregatableNodeTypes.includes(this.b.currentNode.type)
    );
  }

  private atLeastOneAggPart(): boolean {
    return this.a.currentNode.children.length > 2 && this.b.currentNode.children.length > 2;
  }

  private extractTemplateChain(index: number): TemplateChain | null {
    const followedPaths = [];
    let chainDepth = -1;
    let isChain: boolean;
    let chainableNodeTypeConfig: ChainableNodeTypeConfig;
    let chainStart: ChainStart;
    const chainLinks: ChainLink[] = [];
    do {
      chainDepth++;
      if (this.a.currentNode.type !== this.b.currentNode.type) {
        return null;
      }
      chainableNodeTypeConfig = loadChainableNodeTypeConfigFor(
        this.language,
        this.a.currentNode.type
      );
      const pathToLinkBegin = chainableNodeTypeConfig?.pathToLinkBegin;
      if (chainableNodeTypeConfig && this.followBothCursors(pathToLinkBegin)) {
        const fromPath = this.a.currentPath;
        this.reverseFollowBothCursors(pathToLinkBegin);
        chainLinks.push(new ChainLink(fromPath, this.a.currentPath));
      } else if (!chainableNodeTypeConfig && chainDepth >= 2) {
        chainStart = new ChainStart(this.a.currentPath);
        isChain = true;
        break;
      } else if (!chainableNodeTypeConfig && chainDepth < 2) {
        isChain = false;
        break;
      } else {
        isChain = false;
        break;
      }
    } while (
      this.followBothCursors(chainableNodeTypeConfig.pathToNextLink) &&
      followedPaths.push(chainableNodeTypeConfig.pathToNextLink)
    );
    if (isChain === undefined) {
      throw new Error("Failed to determine if chain is present");
    }
    for (const path of followedPaths) {
      this.a.reverseFollow(path);
      this.b.reverseFollow(path);
    }
    return isChain ? new TemplateChain(this.path.concat(index), chainStart, chainLinks) : null;
  }

  extractTemplateAggregation(index: number) {
    const nodeTypeConfig = loadAggregatableNodeTypeConfigFor(
      this.language,
      this.a.currentNode.type
    );
    let aggregationStart: AggregationPart | undefined;
    const limitingTokens = [
      nodeTypeConfig.startToken,
      nodeTypeConfig.delimiterToken,
      nodeTypeConfig.endToken,
    ];
    let aggregationParts = this.a.currentNode.children.map(
      (_, childIndex: number) => new AggregationPart(this.path.concat(index, childIndex))
    );
    aggregationParts = aggregationParts.filter(
      (_, i) => !limitingTokens.includes(this.a.currentNode.children[i].type)
    );
    if (nodeTypeConfig.hasStartPattern) {
      aggregationStart = aggregationParts[0];
      aggregationParts = aggregationParts.slice(1);
    }
    return new TemplateAggregation(
      this.path.concat(index),
      this.a.currentNode.type,
      aggregationParts,
      aggregationStart
    );
  }

  private followBothCursors(path: TreePath): boolean {
    if (this.a.follow(path)) {
      if (this.b.follow(path)) {
        return true;
      } else {
        this.a.reverseFollow(path);
        return false;
      }
    } else {
      return false;
    }
  }

  private reverseFollowBothCursors(path: TreePath) {
    this.a.reverseFollow(path);
    this.b.reverseFollow(path);
  }

  private recordTemplate(index: number) {
    const nodeType = this.a.currentNode.type;
    this.templateParameters.push(new TemplateArgument(this.path.concat(index), [nodeType]));
    this.nodes.push({
      variable: true,
      fieldName: this.a.currentFieldName || undefined,
      type: nodeType,
    });
  }

  private recordVariableWithWildcard(index: number) {
    const nodeType = this.a.currentNode.type;
    this.templateParameters.push(new TemplateArgument(this.path.concat(index), [nodeType]));
    this.nodes.push({
      variable: true,
      type: "*",
      fieldName: this.a.currentFieldName || undefined,
    });
  }

  private recordBlock(index: number) {
    const path = this.path.concat(index);
    const contextVariables = this.undeclaredVariables.get(path);
    this.templateParameters.push(new TemplateBlock(path, contextVariables));
    this.nodes.push({
      variable: true,
      fieldName: this.a.currentFieldName || undefined,
      type: this.a.currentNode.type,
    });
  }

  private recordChain(chain: TemplateChain) {
    this.templateParameters.push(chain);
  }

  private recordAggregation(aggregation: TemplateAggregation) {
    this.templateParameters.push(aggregation);
  }
}
