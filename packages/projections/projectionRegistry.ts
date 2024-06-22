import { Pattern } from "@puredit/parser";
import { RootProjection, SubProjection } from "./types";
import Projection from "./projection";
import AggregationDecorator from "@puredit/parser/pattern/decorators/aggregationDecorator";
import ChainDecorator from "@puredit/parser/pattern/decorators/chainDecorator";
import ReferencePattern from "@puredit/parser/pattern/referencePattern";
import { removeFromArray } from "@puredit/utils-shared";

export default class ProjectionRegistry {
  private _projectionsByPackage: Record<string, Record<string, Projection>> = {};
  private _projectionsAsArray: Projection[] = [];
  private _rootProjectionPatternsByRootNodeType: Record<string, Pattern[]> = {};
  private _projectionsByName: Record<string, Projection> = {};

  private targetPackage: string | undefined;
  private newProjections: Projection[] = [];
  private referencePatterns: ReferencePattern[] = [];

  registerProjectionPackage(packageName: string, rootProjections: RootProjection[]) {
    if (this._projectionsByPackage[packageName]) {
      throw new Error(`Cannot register package with duplicate name ${packageName}`);
    }
    this.beginInsertion(packageName);
    try {
      this._projectionsByPackage[packageName] = {};
      for (const rootProjection of rootProjections) {
        this.insertRootProjectionInternal(packageName, rootProjection);
      }
    } catch (error) {
      this.rollbackInsertion();
      throw error;
    }
    this.commitInsertion();
  }

  insertRootProjection(packageName: string, rootProjection: RootProjection) {
    this.beginInsertion(packageName);
    try {
      this.insertRootProjectionInternal(packageName, rootProjection);
    } catch (error) {
      this.rollbackInsertion();
      throw error;
    }
    this.commitInsertion();
  }

  private insertRootProjectionInternal(packageName: string, rootProjection: RootProjection) {
    const projection = Projection.fromRootProjection(rootProjection);
    this.newProjections.push(projection);
    this.storeProjectionByName(projection);
    this.storeProjectionByPackage(packageName, projection);
    this.storePatternByRootNodeType(projection.pattern);
    this._projectionsAsArray.push(projection);

    const subPatterns = rootProjection.pattern.getSubPatterns();
    this.referencePatterns = this.referencePatterns.concat(
      subPatterns.filter((subPattern) => subPattern instanceof ReferencePattern)
    );
    for (const subProjection of rootProjection.subProjections) {
      const subPattern = subPatterns.find(
        (subPattern) => subPattern.name === subProjection.template.name
      );
      if (!subPattern) {
        throw new Error(`Pattern for subprojection ${subProjection.template.name} not found`);
      }
      this.insertSubProjection(packageName, subProjection, subPattern);
    }
    this.referencePatterns = this.referencePatterns.concat(
      subPatterns.filter((subPattern) => subPattern instanceof ReferencePattern)
    );
  }

  insertAggregationPart(
    packageName: string,
    parentProjectionName: string,
    aggregationName: string,
    subProjection: SubProjection,
    pattern: Pattern,
    subProjectionsBelow: SubProjection[]
  ) {
    this.beginInsertion(packageName);
    try {
      this.insertSubProjection(packageName, subProjection, pattern);
      const parentPattern = this.getPatternBy(
        packageName,
        parentProjectionName
      ) as AggregationDecorator;
      parentPattern.addPartPattern(aggregationName, pattern);

      const subPatterns = pattern.getSubPatterns();
      this.referencePatterns = this.referencePatterns.concat(
        subPatterns.filter((subPattern) => subPattern instanceof ReferencePattern)
      );
      for (const subProjection of subProjectionsBelow) {
        const subPattern = subPatterns.find(
          (subPattern) => subPattern.name === subProjection.template.name
        );
        if (!subPattern) {
          throw new Error(`Pattern for subprojection ${subProjection.template.name} not found`);
        }
        this.insertSubProjection(packageName, subProjection, subPattern);
        removeFromArray(subPatterns, subPattern);
      }
      this.referencePatterns = this.referencePatterns.concat(subPatterns as ReferencePattern[]);
    } catch (error) {
      this.rollbackInsertion();
    }
    this.commitInsertion();
  }

  insertChainLink(
    packageName: string,
    parentProjectionName: string,
    chainName: string,
    subProjection: SubProjection,
    pattern: Pattern,
    subProjectionsBelow: SubProjection[]
  ) {
    this.beginInsertion(packageName);
    try {
      this.insertSubProjection(packageName, subProjection, pattern);
      const parentPattern = this.getPatternBy(packageName, parentProjectionName) as ChainDecorator;
      parentPattern.addLinkPattern(chainName, pattern);

      const subPatterns = pattern.getSubPatterns();
      this.referencePatterns = this.referencePatterns.concat(
        subPatterns.filter((subPattern) => subPattern instanceof ReferencePattern)
      );
      for (const subProjection of subProjectionsBelow) {
        const subPattern = subPatterns.find(
          (subPattern) => subPattern.name === subProjection.template.name
        );
        if (!subPattern) {
          throw new Error(`Pattern for subprojection ${subProjection.template.name} not found`);
        }
        this.insertSubProjection(packageName, subProjection, subPattern);
        removeFromArray(subPatterns, subPattern);
      }
      this.referencePatterns = this.referencePatterns.concat(subPatterns as ReferencePattern[]);
    } catch (error) {
      this.rollbackInsertion();
    }
    this.commitInsertion();
  }

  private beginInsertion(targetPackage: string) {
    this.targetPackage = targetPackage;
    this.newProjections = [];
    this.referencePatterns = [];
  }

  private rollbackInsertion() {
    this.removeProjections(this.newProjections);
    this.newProjections = [];
    this.referencePatterns = [];
    this.targetPackage = undefined;
  }

  private commitInsertion() {
    try {
      this.referencePatterns.forEach((pattern: ReferencePattern) =>
        pattern.resolve(this, this.targetPackage!)
      );
    } catch (error) {
      this.rollbackInsertion();
      throw error;
    }
    this.newProjections = [];
    this.referencePatterns = [];
    this.targetPackage = undefined;
  }

  private insertSubProjection(packageName: string, subProjection: SubProjection, pattern: Pattern) {
    const projection = Projection.fromSubProjection(subProjection, pattern);
    this.newProjections.push(projection);
    this.storeProjectionByName(projection);
    this.storeProjectionByPackage(packageName, projection);
    this._projectionsAsArray.push(projection);
  }

  private storeProjectionByName(projection: Projection) {
    const name = projection.pattern.name;
    if (this._projectionsByName[name]) {
      throw new Error(`Cannot store projection with duplicate name ${name}`);
    }
    this._projectionsByName[name] = projection;
  }

  private storeProjectionByPackage(packageName: string, projection: Projection) {
    const pkg = this._projectionsByPackage[packageName];
    if (!pkg) {
      throw new Error(`Unknown package ${packageName}`);
    }
    pkg[projection.name] = projection;
  }

  private storePatternByRootNodeType(pattern: Pattern) {
    const nodeTypes = pattern.getTypesMatchedByRootNode();
    for (const nodeType of nodeTypes) {
      let patternsWithRootNodeType: Pattern[] =
        this._rootProjectionPatternsByRootNodeType[nodeType];
      if (!patternsWithRootNodeType) {
        patternsWithRootNodeType = [];
      }
      patternsWithRootNodeType.push(pattern);
      this._rootProjectionPatternsByRootNodeType[nodeType] = patternsWithRootNodeType;
    }
  }

  removePackage(packageName: string) {
    const pkg = this._projectionsByPackage[packageName];
    if (!pkg) {
      return;
    }
    const projectionsToRemove = Object.values(pkg);
    this.removeProjections(projectionsToRemove);
  }

  private removeProjections(projections: Projection[]) {
    const patternsToRemove = projections.map((projection) => projection.pattern);
    this._projectionsAsArray.filter((projection) => !projections.includes(projection));
    Object.values(this._rootProjectionPatternsByRootNodeType).forEach((patterns) => {
      patterns.filter((pattern) => !patternsToRemove.includes(pattern));
    });
    patternsToRemove.forEach((pattern) => delete this._projectionsByName[pattern.name]);
  }

  getPatternBy(packageName: string, projectionName: string) {
    const pkg = this._projectionsByPackage[packageName];
    if (pkg) {
      const projection = pkg[projectionName];
      if (projection) {
        return projection.pattern;
      } else {
        throw new Error(`Unknown projection ${projectionName} in package ${packageName}`);
      }
    } else {
      throw new Error(`Unknown package ${packageName}`);
    }
  }

  get projectionsByPackage() {
    return Object.assign({}, this._projectionsByPackage);
  }

  get projectionsAsArray() {
    return [...this._projectionsAsArray];
  }

  get rootProjectionPatternsByRootNodeType() {
    return Object.assign({}, this._rootProjectionPatternsByRootNodeType);
  }

  get projectionsByName() {
    return Object.assign({}, this._projectionsByName);
  }
}
