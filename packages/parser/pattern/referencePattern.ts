import { Language } from "@puredit/language-config";
import { PatternNode, PatternsMap } from "..";
import TreePath from "../cursor/treePath";
import Pattern from "./pattern";
import { ProjectionRegistry } from "@puredit/projections";
import AggregationDecorator from "./decorators/aggregationDecorator";
import ChainDecorator from "./decorators/chainDecorator";

/**
 * @class
 * Represents a pointer to an existing pattern. It is required to reuse patterns.
 * A reference pattern has two states:
 * - Unresolved: The ReferencePattern does not have a reference to pattern it points to,
 *               therefore, no method of the pattern it points to an be called.
 * - Resolved:   The ReferencePattern has a reference to the pattern it points to,
 *               therefore, the methods of the of the pattern it points to an be called.
 */
export default class ReferencePattern implements Pattern {
  private readonly _name: string;
  private referencedPattern: Pattern | undefined;

  constructor(name: string) {
    this._name = name;
  }

  /**
   * Attempt to resolve the pattern. The pattern the ReferencePattern points to, must be
   * present in the projection registry.
   * @param projectionRegistry
   * @param packageName
   */
  resolve(projectionRegistry: ProjectionRegistry, packageName: string) {
    const referencedPattern = projectionRegistry.getPatternBy(packageName, this._name);
    if (!referencedPattern) {
      throw new Error(`Unresolved ReferencePattern ${this._name}`);
    }
    this.referencedPattern = referencedPattern;
  }

  assertTemplateResolved() {
    if (!this.referencedPattern) {
      throw new Error("ReferenceTemplate must be resolved before it can be accessed");
    }
  }

  getTypesMatchedByRootNode(): string[] {
    this.assertTemplateResolved();
    return this.referencedPattern!.getTypesMatchedByRootNode();
  }

  getPathToNodeWithText(text: string): TreePath {
    this.assertTemplateResolved();
    return this.referencedPattern!.getPathToNodeWithText(text);
  }

  toDraftString(): string {
    this.assertTemplateResolved();
    return this.referencedPattern!.toDraftString();
  }

  getSubPatterns(): Pattern[] {
    if (!this.referencedPattern) {
      return [];
    }
    return this.referencedPattern!.getSubPatterns();
  }

  get language(): Language {
    this.assertTemplateResolved();
    return this.referencedPattern!.language;
  }

  get name(): string {
    return this._name;
  }

  get rootNode(): PatternNode {
    this.assertTemplateResolved();
    return this.referencedPattern!.rootNode;
  }

  get priority(): number {
    this.assertTemplateResolved();
    return this.referencedPattern!.priority;
  }

  getStartPatternMapFor(name: string): PatternsMap | undefined {
    this.assertTemplateResolved();
    let referencedPattern;
    if (this.referencedPattern instanceof ChainDecorator) {
      referencedPattern = this.referencedPattern as ChainDecorator;
    } else if (this.referencedPattern instanceof AggregationDecorator) {
      referencedPattern = this.referencedPattern as AggregationDecorator;
    } else {
      throw new Error(
        `ReferencePattern ${
          this.referencedPattern!.name
        } references neither AggregationDecorator nor ChainDecorator`
      );
    }
    return referencedPattern.getStartPatternMapFor(name);
  }

  getStartPatternFor(name: string): Pattern {
    this.assertTemplateResolved();
    let referencedPattern;
    if (this.referencedPattern instanceof ChainDecorator) {
      referencedPattern = this.referencedPattern as ChainDecorator;
    } else if (this.referencedPattern instanceof AggregationDecorator) {
      referencedPattern = this.referencedPattern as AggregationDecorator;
    } else {
      throw new Error(
        `ReferencePattern ${
          this.referencedPattern!.name
        } references neither AggregationDecorator nor ChainDecorator`
      );
    }
    return referencedPattern.getStartPatternFor(name);
  }

  assertReferencesAggregationDecorator() {
    if (!(this.referencedPattern instanceof AggregationDecorator)) {
      throw new Error(
        `ReferencePattern ${this.referencedPattern!.name} does not reference AggregationDecorator`
      );
    }
  }

  getPartPatternsMapFor(aggregationName: string): PatternsMap {
    this.assertTemplateResolved();
    this.assertReferencesAggregationDecorator();
    const referencedPattern = this.referencedPattern as AggregationDecorator;
    return referencedPattern.getPartPatternsMapFor(aggregationName);
  }

  getPartPatternsFor(aggregationName: string): Pattern[] {
    this.assertTemplateResolved();
    this.assertReferencesAggregationDecorator();
    const referencedPattern = this.referencedPattern as AggregationDecorator;
    return referencedPattern.getPartPatternsFor(aggregationName);
  }

  getNodeTypeFor(aggregationName: string): string {
    this.assertTemplateResolved();
    this.assertReferencesAggregationDecorator();
    const referencedPattern = this.referencedPattern as AggregationDecorator;
    return referencedPattern.getNodeTypeFor(aggregationName);
  }

  addPartPattern(aggregationName: string, pattern: Pattern) {
    this.assertTemplateResolved();
    this.assertReferencesAggregationDecorator();
    const referencedPattern = this.referencedPattern as AggregationDecorator;
    return referencedPattern.addPartPattern(aggregationName, pattern);
  }

  assertReferencesChainDecorator() {
    if (!(this.referencedPattern instanceof ChainDecorator)) {
      throw new Error(
        `ReferencePattern ${this.referencedPattern!.name} does not reference ChainDecorator`
      );
    }
  }

  getLinkPatternsFor(chainName: string): Pattern[] {
    this.assertTemplateResolved();
    this.assertReferencesChainDecorator();
    const referencedPattern = this.referencedPattern as ChainDecorator;
    return referencedPattern.getLinkPatternsFor(chainName);
  }

  getAllLinkPatterns(): Pattern[] {
    this.assertTemplateResolved();
    this.assertReferencesChainDecorator();
    const referencedPattern = this.referencedPattern as ChainDecorator;
    return referencedPattern.getAllLinkPatterns();
  }

  getLinkPatternMapFor(chainName: string): PatternsMap {
    this.assertTemplateResolved();
    this.assertReferencesChainDecorator();
    const referencedPattern = this.referencedPattern as ChainDecorator;
    return referencedPattern.getLinkPatternMapFor(chainName);
  }

  addLinkPattern(chainName: string, pattern: Pattern) {
    this.assertTemplateResolved();
    this.assertReferencesChainDecorator();
    const referencedPattern = this.referencedPattern as ChainDecorator;
    return referencedPattern.addLinkPattern(chainName, pattern);
  }
}
