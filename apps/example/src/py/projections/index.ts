import type { ProjectionPluginConfig } from "@puredit/projections";
import { pythonParser } from "./parser";
import { globalContextValues, globalContextVariables } from "./context";
import { evaluateMathProjection } from "./evaluateMathProjection";
import { compileMathProjection } from "./compileMathProjection";

import { complexSelectProjection } from "./complexSelect/complexSelectProjection";

import { selectChainProjection } from "./selectChain/selectChainProjection";
import { selectSubProjection } from "./selectChain/selectSubProjection";
import { filterSubProjection } from "./selectChain/filterSubProjection";
import { startSubProjection } from "./selectChain/startSubProjection";
import { columnSubProjection } from "./complexSelect/columnSubProjection";
import { columnWithAliasSubProjection } from "./complexSelect/columnWithAliasSubProjection";

export const projectionPluginConfig: ProjectionPluginConfig = {
  parser: pythonParser,
  projections: [
    evaluateMathProjection,
    compileMathProjection,
    complexSelectProjection,
    selectChainProjection,
  ],
  subProjections: [
    columnSubProjection,
    columnWithAliasSubProjection,
    selectSubProjection,
    filterSubProjection,
    startSubProjection,
  ],
  globalContextVariables,
  globalContextValues,
};
