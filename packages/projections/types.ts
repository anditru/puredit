import type { Text } from "@codemirror/state";
import type { Context, Match, Parser } from "@puredit/parser";
import type { ProjectionWidgetClass } from "./projection";
import type { Pattern } from "@puredit/parser";

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
  partWidgetsMapping?: Record<string, any>;
  contextProvider?(match: Match, text: Text, context: object): object;
}

export interface ProjectionPluginConfig {
  parser: Parser;
  projections: Projection[];
  globalContextVariables: Context;
  globalContextValues: object;
}
