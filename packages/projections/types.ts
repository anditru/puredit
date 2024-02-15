import type { Text } from "@codemirror/state";
import type { Context, Match, Parser } from "@puredit/parser";
import type { ProjectionWidgetClass } from "./projection";
import type { Pattern } from "@puredit/parser";
import RawTemplate from "@puredit/parser/define/rawTemplate";

export interface ProjectionCompletion {
  label: string;
  info: string;
  draft(context: Context): string;
}

export interface Projection {
  name: string;
  description: string;
  pattern: Pattern;
  requiredContextVariables: string[];
  widgets: Array<ProjectionWidgetClass>;
  contextProvider?(match: Match, text: Text, context: object): object;
}

export interface SubProjection {
  name: string;
  description: string;
  pattern: RawTemplate;
  requiredContextVariables: string[];
  widgets: Array<ProjectionWidgetClass>;
  contextProvider?(match: Match, text: Text, context: object): object;
}

export interface ProjectionPluginConfig {
  parser: Parser;
  projections: Projection[];
  subProjections: SubProjection[];
  globalContextVariables: Context;
  globalContextValues: object;
}
