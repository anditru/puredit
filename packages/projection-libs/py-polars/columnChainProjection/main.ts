import { chain } from "@puredit/parser";
import type { RootProjection } from "@puredit/projections/types";
import { parser } from "../parser";

import { columnStartSubProjection } from "./columnStartSubProjection/config";
import { colSubProjection } from "./colSubProjection/config";
import { aliasSubProjection } from "./aliasSubProjection/config";
import { sumAggregationSubProjection } from "./sumAggregationSubProjection/config";
import { avgAggregationSubProjection } from "./avgAggregationSubProjection/config";
import { castSubProjection } from "./castSubProjection/config";

export const columnChain = chain(
  "columnChain",
  columnStartSubProjection.template,
  [
    colSubProjection.template,
    aliasSubProjection.template,
    sumAggregationSubProjection.template,
    avgAggregationSubProjection.template,
    castSubProjection.template,
  ],
  1
);

const pattern = parser.statementPattern("Polars:Column:Chain")`${columnChain}`;

export const columnChainProjection: RootProjection = {
  pattern,
  description: "Pick a column and apply transformations to it.",
  requiredContextVariables: [],
  segmentWidgets: [],
  subProjections: [
    columnStartSubProjection,
    colSubProjection,
    aliasSubProjection,
    sumAggregationSubProjection,
    avgAggregationSubProjection,
    castSubProjection,
  ],
};
