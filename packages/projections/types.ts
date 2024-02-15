import type { Text } from "@codemirror/state";
import type { Context, Match, Parser } from "@puredit/parser";
import type { ProjectionWidgetClass } from "./projection";
import type { Pattern } from "@puredit/parser";
import type RawTemplate from "@puredit/parser/define/rawTemplate";

export interface ProjectionCompletion {
  label: string;
  info: string;
  draft(context: Context): string;
}

export interface Projection {
  name: string;
  description: string;
  requiredContextVariables: string[];
  prefixWidget?: ProjectionWidgetClass;
  segmentWidgets: Array<ProjectionWidgetClass>;
  postfixWidget?: ProjectionWidgetClass;
  contextProvider?(match: Match, text: Text, context: Context): object;
}

export interface RootProjection extends Projection {
  pattern: Pattern;
}

export interface SubProjection extends Projection {
  pattern: RawTemplate;
}

export interface ProjectionPluginConfig {
  parser: Parser;
  projections: RootProjection[];
  subProjections: SubProjection[];
  globalContextVariables: Context;
  globalContextValues: any;
}
