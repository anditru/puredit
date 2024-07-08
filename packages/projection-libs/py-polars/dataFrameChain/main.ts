import { chain } from "@puredit/parser";
import type { RootProjection } from "@puredit/projections";
import { parser } from "../parser";
import { baseDataframeSubProjection } from "./baseDataframe";
import { selectSubProjection } from "./select";
import { columnSubProjection } from "./column";
import { columnWithAliasSubProjection } from "./columnWithAlias";
import { dropAllNullsSubProjection } from "./dropAllNulls";
import { dropNullsSubProjection } from "./dropNulls";
import { groupBySubProjection } from "./groupBy";
import { aggSubProjection } from "./aggregate";
import { dropColumnsSubProjection } from "./dropColumns";
import { renameColumnsSubProjection } from "./renameColumns";
import { columnMappingSubProjection } from "./columnMapping";
import { joinSubProjection } from "./join/config";
import { binColumnCompositionSubProjection } from "./binColumnComposition";
import { extendSubProjection } from "./extend";
import { meltSubProjection } from "./melt";
import { pivotSubProjection } from "./pivot/config";

const dataframeChain = chain(
  "dataframeChain",
  baseDataframeSubProjection.template,
  [
    selectSubProjection.template,
    dropAllNullsSubProjection.template,
    dropNullsSubProjection.template,
    groupBySubProjection.template,
    aggSubProjection.template,
    dropColumnsSubProjection.template,
    renameColumnsSubProjection.template,
    joinSubProjection.template,
    extendSubProjection.template,
    meltSubProjection.template,
    pivotSubProjection.template,
  ],
  1
);

const pattern = parser.expressionPattern("Polars:Dataframe:Chain")`${dataframeChain}`;

export const dataFrameChainProjection: RootProjection = {
  pattern,
  description: "Transform a dataframe.",
  requiredContextVariables: [],
  segmentWidgets: [],
  subProjections: [
    baseDataframeSubProjection,
    selectSubProjection,
    columnSubProjection,
    columnWithAliasSubProjection,
    dropAllNullsSubProjection,
    dropNullsSubProjection,
    groupBySubProjection,
    aggSubProjection,
    dropColumnsSubProjection,
    renameColumnsSubProjection,
    columnMappingSubProjection,
    joinSubProjection,
    binColumnCompositionSubProjection,
    extendSubProjection,
    meltSubProjection,
    pivotSubProjection,
  ],
};
