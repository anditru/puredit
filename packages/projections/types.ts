import type { Text } from "@codemirror/state";
import type { Match, Parser, TransformableTemplate } from "@puredit/parser";
import type { ProjectionWidgetClass } from "./widget/widget";
import type { Pattern } from "@puredit/parser";
import ProjectionRegistry from "./state/projectionRegistry";
import { ProjectionCompiler } from "@puredit/declarative-projections";

export interface ProjectionPluginConfig {
  parser: Parser;
  projectionRegistry: ProjectionRegistry;
  globalContextVariables: ContextVariableMap;
  globalContextInformation: ContextInformation;
  projectionCompiler?: ProjectionCompiler;
}

export interface RootProjection {
  pattern: Pattern;
  description: string;
  requiredContextVariables: string[];
  segmentWidgets: Array<ProjectionWidgetClass>;
  contextProvider?: FnContextProvider;
  subProjections: SubProjection[];
}

export interface SubProjection {
  template: TransformableTemplate;
  description: string;
  requiredContextVariables: string[];
  segmentWidgets: Array<ProjectionWidgetClass>;
  contextProvider?: FnContextProvider;
}

export interface SubProjectionWithPattern extends SubProjection {
  pattern: Pattern;
}

export type FnContextProvider = (
  match: Match,
  text: Text,
  contextInformation: ContextInformation
) => ContextInformation;

export type ContextVariableMap = Record<string, any | undefined>;
export type ContextInformation = Record<string, any>;

export interface Range {
  from: number;
  to: number;
}
