import type { ProjectionPluginConfig } from "@puredit/projections";
import { pythonParser } from "./parser";
import { evaluateMathProjection } from "./evaluateMathProjection";
import { compileMathProjection } from "./compileMathProjection";
//import { selectProjection } from "./selectProjection";
import { globalContextValues, globalContextVariables } from "./context";

export const projectionPluginConfig: ProjectionPluginConfig = {
  parser: pythonParser,
  projections: [
    evaluateMathProjection,
    compileMathProjection,
    //selectProjection,
  ],
  globalContextVariables,
  globalContextValues,
};
