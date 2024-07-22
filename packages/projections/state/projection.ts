import { Pattern } from "@puredit/parser";
import { ProjectionWidgetClass } from "../widget/widget";
import { FnContextProvider, RootProjection, SubProjection } from "../types";

/**
 * @class
 * Internal represenation of a projection as they are stored in the ProjectionRegistry.
 *
 * The main difference to the representation provided by DSL developers in projection-libs
 * is that we do not distinguish between root projections and subprojections since this
 * distinction is only requried because unitl the templates are parsed since the temaples
 * of subprojections must be parsed in the correct context.
 */
export default class Projection {
  static fromRootProjection(rootProjection: RootProjection) {
    return new this(
      rootProjection.pattern.name,
      rootProjection.pattern,
      rootProjection.description,
      rootProjection.requiredContextVariables,
      rootProjection.segmentWidgets,
      rootProjection.contextProvider
    );
  }

  static fromSubProjection(subProjection: SubProjection, pattern: Pattern) {
    return new this(
      subProjection.template.name,
      pattern,
      subProjection.description,
      subProjection.requiredContextVariables,
      subProjection.segmentWidgets,
      subProjection.contextProvider
    );
  }

  private constructor(
    public readonly name: string,
    public readonly pattern: Pattern,
    public readonly description: string,
    public readonly requiredContextVariables: string[],
    public readonly segmentWidgets: Array<ProjectionWidgetClass>,
    public readonly contextProvider?: FnContextProvider
  ) {}
}
