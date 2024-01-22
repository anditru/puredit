import type { ProjectionPluginConfig } from "@puredit/projections";
import { pythonParser } from "./parser";
import { selectProjection } from "./selectProjection";
import { globalContextValues, globalContextVariables } from "./context";

export const projectionPluginConfig: ProjectionPluginConfig = {
  parser: pythonParser,
  projections: [selectProjection],
  globalContextVariables,
  globalContextValues,
};
