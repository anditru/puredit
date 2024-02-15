import type { ProjectionPluginConfig } from "@puredit/projections";
import { globalContextValues, globalContextVariables } from "./context";
import { tsParser } from "./parser";
import { logProjection } from "./logProjection";
import { changeProjection } from "./changeProjection";
import { replaceProjection } from "./replaceProjection";
import { trimProjection } from "./trimProjection";

export const projectionPluginConfig: ProjectionPluginConfig = {
  parser: tsParser,
  projections: [changeProjection, replaceProjection, trimProjection, logProjection],
  subProjections: [],
  globalContextVariables,
  globalContextValues,
};
