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
import { columnChainSubProjection } from "./columnChainSubProjection/config";
import { joinSubProjection } from "./joinSubProjection/config";
import { binColumnCompositionSubProjection } from "./binColumnCompositionSubProjection/config";
import { extendDataFrameSubProjection } from "./extendDataFrameSubProjection/config";
import { meltSubProjection } from "./meltSubProjection/config";
import { pivotSubProjection } from "./pivotSubProjection/config";

const processingChain = chain(
  "processingChain",
  selectStartSubProjection.pattern,
  [
    selectSubProjection.pattern,
    filterSubProjection.pattern,
    dropNullsSubProjection.pattern,
    dropNullsColumnsSubProjection.pattern,
    groupBySubProjection.pattern,
    aggSubProjection.pattern,
    dropColumnsSubProjection.pattern,
    renameColumnsSubProjection.pattern,
    joinSubProjection.pattern,
    extendDataFrameSubProjection.pattern,
    meltSubProjection.pattern,
    pivotSubProjection.pattern,
  ],
  1
);

const pattern = parser.expressionPattern("selectChainPattern")`${processingChain}`;

export const selectChainProjection: RootProjection = {
  name: "Polars:Dataframe:Chain",
  description: "Transform a dataframe.",
  pattern,
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
    columnChainSubProjection,
    joinSubProjection,
    binColumnCompositionSubProjection,
    extendDataFrameSubProjection,
    meltSubProjection,
    pivotSubProjection,
  ],
};
