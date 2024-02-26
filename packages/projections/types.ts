import type { Text } from "@codemirror/state";
import type { Context, Match, Parser } from "@puredit/parser";
import type { ProjectionWidgetClass } from "./projection";
import type { Pattern } from "@puredit/parser";
import type Template from "@puredit/parser/template/template";

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
  subProjections: SubProjection[];
}

export interface SubProjection extends Projection {
  pattern: Template;
}

export interface ProjectionPluginConfig {
  parser: Parser;
  projections: RootProjection[];
  globalContextVariables: Context;
  globalContextValues: any;
}
