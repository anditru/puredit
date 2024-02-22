import type { ProjectionPluginConfig } from "@puredit/projections";
import { pythonParser } from "./parser";
import { globalContextValues, globalContextVariables } from "./context";
import { evaluateMathProjection } from "./evaluateMathProjection";
import { compileMathProjection } from "./compileMathProjection";

import { selectChainProjection } from "./selectChain/selectChainProjection";
import { selectSubProjection } from "./selectChain/selectFunction/selectSubProjection";
import { filterSubProjection } from "./selectChain/filterFunction/filterSubProjection";
import { selectStartSubProjection } from "./selectChain/start/startSubProjection";
import { columnSubProjection } from "./selectChain/selectFunction/columnSubProjection";
import { columnWithAliasSubProjection } from "./selectChain/selectFunction/columnWithAliasSubProjection";

import { columnChainProjection } from "./columnChain/columnChainProjection";
import { columnStartSubProjection } from "./columnChain/startSubProjection";
import { colSubProjection } from "./columnChain/colSubProjection/config";
import { lowerCaseSubProjection } from "./columnChain/lowerCaseSubProjection/config";
import { aliasSubProjection } from "./columnChain/aliasSubProjection/config";
import { attributeSubProjection } from "./columnChain/attributeSubProjection/config";
import { upperCaseSubProjection } from "./columnChain/upperCaseSubProjection/config";

export const projectionPluginConfig: ProjectionPluginConfig = {
  parser: pythonParser,
  projections: [
    evaluateMathProjection,
    compileMathProjection,
    selectChainProjection,
    columnChainProjection,
  ],
  subProjections: [
    selectStartSubProjection,
    selectSubProjection,
    columnSubProjection,
    columnWithAliasSubProjection,
    filterSubProjection,

    columnStartSubProjection,
    aliasSubProjection,
    attributeSubProjection,
    colSubProjection,
    lowerCaseSubProjection,
    upperCaseSubProjection,
  ],
  globalContextVariables,
  globalContextValues,
};
