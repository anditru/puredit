import type { ProjectionPluginConfig } from "@puredit/projections";
import { pythonParser } from "./parser";
import { takeProjection } from "./takeProjection";
import { globalContextValues, globalContextVariables } from "./context";

export const projectionPluginConfig: ProjectionPluginConfig = {
  parser: pythonParser,
  projections: [takeProjection],
  globalContextVariables,
  globalContextValues,
};
