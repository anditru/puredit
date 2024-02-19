import type { ProjectionPluginConfig } from "@puredit/projections";
import { pythonParser } from "./parser";
import { globalContextValues, globalContextVariables } from "./context";
import { evaluateMathProjection } from "./evaluateMathProjection";
import { compileMathProjection } from "./compileMathProjection";

import { selectChainProjection } from "./selectChain/selectChainProjection";
import { selectSubProjection } from "./selectChain/selectFunction/selectSubProjection";
import { filterSubProjection } from "./selectChain/filterFunction/filterSubProjection";
import { startSubProjection } from "./selectChain/start/startSubProjection";
import { columnSubProjection } from "./selectChain/selectFunction/columnSubProjection";
import { columnWithAliasSubProjection } from "./selectChain/selectFunction/columnWithAliasSubProjection";

export const projectionPluginConfig: ProjectionPluginConfig = {
  parser: pythonParser,
  projections: [evaluateMathProjection, compileMathProjection, selectChainProjection],
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
