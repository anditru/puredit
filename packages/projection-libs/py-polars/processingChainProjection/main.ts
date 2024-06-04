import { chain } from "@puredit/parser";
import type { RootProjection } from "@puredit/projections/types";
import { parser } from "../parser";

import { selectStartSubProjection } from "./selectStartSubProjection/config";
import { selectSubProjection } from "./selectSubProjection/config";
import { columnSubProjection } from "./columnSubProjection/config";
import { columnWithAliasSubProjection } from "./columnWithAliasSubProjection/config";
import { filterSubProjection } from "./filterSubProjection/config";
import { dropNullsSubProjection } from "./dropNullsSubProjection/config";
import { dropNullsColumnsSubProjection } from "./dropNullsColumnsSubProjection/config";
import { groupBySubProjection } from "./groupBySubProjection/config";
import { aggSubProjection } from "./aggSubProjection/config";
import { dropColumnsSubProjection } from "./dropColumnsSubProjection/config";
import { renameColumnsSubProjection } from "./renameColumnsSubProjection/config";
import { columnMappingSubProjection } from "./columnMappingSubProjection/config";
import { joinSubProjection } from "./joinSubProjection/config";
import { binColumnCompositionSubProjection } from "./binColumnCompositionSubProjection/config";
import { extendDataFrameSubProjection } from "./extendDataFrameSubProjection/config";
import { meltSubProjection } from "./meltSubProjection/config";
import { pivotSubProjection } from "./pivotSubProjection/config";

const dataframeChain = chain(
  "dataframeChain",
  selectStartSubProjection.template,
  [
    selectSubProjection.template,
    filterSubProjection.template,
    dropNullsSubProjection.template,
    dropNullsColumnsSubProjection.template,
    groupBySubProjection.template,
    aggSubProjection.template,
    dropColumnsSubProjection.template,
    renameColumnsSubProjection.template,
    joinSubProjection.template,
    extendDataFrameSubProjection.template,
    meltSubProjection.template,
    pivotSubProjection.template,
  ],
  1
);

const pattern = parser.expressionPattern("Polars:Dataframe:Chain")`${dataframeChain}`;

export const selectChainProjection: RootProjection = {
  pattern,
  description: "Transform a dataframe.",
  requiredContextVariables: [],
  segmentWidgets: [],
  subProjections: [
    selectStartSubProjection,
    selectSubProjection,
    columnSubProjection,
    columnWithAliasSubProjection,
    filterSubProjection,
    dropNullsSubProjection,
    dropNullsColumnsSubProjection,
    groupBySubProjection,
    aggSubProjection,
    dropColumnsSubProjection,
    renameColumnsSubProjection,
    columnMappingSubProjection,
    joinSubProjection,
    binColumnCompositionSubProjection,
    extendDataFrameSubProjection,
    meltSubProjection,
    pivotSubProjection,
  ],
};
