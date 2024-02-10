import type { ProjectionPluginConfig } from "@puredit/projections";
import { pythonParser } from "./parser";
import { globalContextValues, globalContextVariables } from "./context";
import { evaluateMathProjection } from "./evaluateMathProjection";
import { compileMathProjection } from "./compileMathProjection";
import { selectProjection } from "./selectProjection";
import { chainTestProjection } from "./chainTestProjection";

export const projectionPluginConfig: ProjectionPluginConfig = {
  parser: pythonParser,
  projections: [
    evaluateMathProjection,
    compileMathProjection,
    selectProjection,
    chainTestProjection,
  ],
  globalContextVariables,
  globalContextValues,
};
