import type { ProjectionPluginConfig } from "@puredit/projections";
import { globalContextValues, globalContextVariables } from "./context";
import { pythonParser } from "./parser";
import { changeProjection } from "./changeProjection";
import { trimProjection } from "./trimProjection";
import { replaceProjection } from "./replaceProjection";

export const projectionPluginConfig: ProjectionPluginConfig = {
  parser: pythonParser,
  projections: [changeProjection, replaceProjection, trimProjection],
  subProjections: [],
  globalContextVariables,
  globalContextValues,
};
