import type { Tree } from "web-tree-sitter";
import { PatternCursor, PatternNode } from "../pattern";
import { Language } from "../common";
import {
  ChainableNodeTypeConfig,
  loadBlocksConfigFor,
  loadChainableNodeTypeConfigFor,
  loadChainableNodeTypesFor,
} from "@puredit/language-config";
import { BlockVariableMap, Path } from "../context-var-detection/blockVariableMap";
import AstCursor from "@puredit/parser/ast/cursor";
import { findUndeclaredVariables } from "../context-var-detection";
import TemplateParameterArray from "../template/parameterArray";
import TemplateArgument from "../template/argument";
import TemplateBlock from "../template/block";
import TemplateChain from "../template/chain";
import TemplateContextVariable from "../template/contextVariable";

export interface CodeScanResult {
  pattern: PatternNode;
  templateParameters: TemplateParameterArray;
}

export function scanCode(
  samples: Tree[],
  language: Language,
  ignoreBlocks: boolean
): CodeScanResult {
  const undeclaredVariables = findUndeclaredVariables(samples, language as Language, ignoreBlocks);
  let nodes: PatternNode[] = [];
  let templateParameters = new TemplateParameterArray();
  let cursor: AstCursor | PatternCursor = new AstCursor(samples[0].walk());
  for (let i = 1; i < samples.length; i++) {
    const nodeComparison = new NodeComparison(
      cursor,
      new AstCursor(samples[i].walk()),
      language,
      undeclaredVariables,
      true
    );
    [nodes, templateParameters] = nodeComparison.execute(ignoreBlocks);
    cursor = new PatternCursor(nodes[0]);
  }

  const contextVariables = ignoreBlocks
    ? undeclaredVariables.getAll()
    : undeclaredVariables.get([]);
  const templateContextVariables = contextVariables.map(
    (contextVariable) => new TemplateContextVariable(contextVariable.path, contextVariable.name)
  );
  templateParameters = templateParameters.concat(
    templateContextVariables
  ) as TemplateParameterArray;
  return { pattern: nodes[0], templateParameters };
}

class NodeComparison {
  // Input
  private ignoreBlocks = false;
  private blockNodeType: string;
  private chainableNodeTypes: string[];

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
      // if (!this.inChain && this.nodesAreChainable() && this.isChain()) {
      //   this.recordChain(index);
      //   this.inChain = true;
      // }
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

  private isChain(): boolean {
    const followedPathsA = [];
    const followedPathsB = [];
    let chainDepth = -1;
    let chainableNodeTypeConfig: ChainableNodeTypeConfig;
    let isChain = false;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      chainDepth++;
      if (this.a.currentNode.type !== this.b.currentNode.type) {
        isChain = false;
        break;
      }
      chainableNodeTypeConfig = loadChainableNodeTypeConfigFor(
        this.language,
        this.a.currentNode.type
      );
      if (chainableNodeTypeConfig && chainDepth < 2) {
        const pathToNextLink = chainableNodeTypeConfig.pathToNextLink;
        if (this.a.follow(pathToNextLink)) {
          followedPathsA.push(pathToNextLink);
        } else {
          isChain = false;
          break;
        }
        if (this.b.follow(pathToNextLink)) {
          followedPathsB.push(pathToNextLink);
        } else {
          isChain = false;
          break;
        }
        continue;
      } else if (!chainableNodeTypeConfig && chainDepth < 2) {
        isChain = false;
        break;
      } else if (chainDepth >= 2) {
        isChain = true;
        break;
      }
      const pathToNextLink = chainableNodeTypeConfig.pathToNextLink;
      if (this.a.follow(pathToNextLink)) {
        followedPathsA.push(pathToNextLink);
      } else {
        isChain = false;
        break;
      }
      if (this.b.follow(pathToNextLink)) {
        followedPathsB.push(pathToNextLink);
      } else {
        isChain = false;
        break;
      }
    }
    for (const path of followedPathsA) {
      this.a.reverseFollow(path);
    }
    for (const path of followedPathsB) {
      this.b.reverseFollow(path);
    }
    return isChain;
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

  private recordChain(index: number) {
    this.templateParameters.push(new TemplateChain(this.path.concat(index)));
    this.nodes.push({
      variable: true,
      fieldName: this.a.currentFieldName || undefined,
      type: this.a.currentNode.type,
    });
  }
}
