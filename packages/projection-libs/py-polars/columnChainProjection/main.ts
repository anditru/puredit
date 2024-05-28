import { chain } from "@puredit/parser";
import type { RootProjection } from "@puredit/projections/types";
import { parser } from "../parser";

import { columnStartSubProjection } from "./columnStartSubProjection/config";
import { colSubProjection } from "./colSubProjection/config";
import { upperCaseSubProjection } from "./upperCaseSubProjection/config";
import { lowerCaseSubProjection } from "./lowerCaseSubProjection/config";
import { aliasSubProjection } from "./aliasSubProjection/config";
import { sumAggregationSubProjection } from "./sumAggregationSubProjection/config";
import { avgAggregationSubProjection } from "./avgAggregationSubProjection/config";
import { castSubProjection } from "./castSubProjection/config";

export const columnChain = chain(
  "columnChain",
  columnStartSubProjection.pattern,
  [
    colSubProjection.pattern,
    upperCaseSubProjection.pattern,
    lowerCaseSubProjection.pattern,
    aliasSubProjection.pattern,
    sumAggregationSubProjection.pattern,
    avgAggregationSubProjection.pattern,
    castSubProjection.pattern,
  ],
  1
);

const pattern = parser.statementPattern("columnChainPattern")`${columnChain}`;

export const columnChainProjection: RootProjection = {
  name: "Polars:Column:Chain",
  description: "Pick a column and apply transformations to it.",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [],
  subProjections: [
    columnStartSubProjection,
    colSubProjection,
    upperCaseSubProjection,
    lowerCaseSubProjection,
    aliasSubProjection,
    sumAggregationSubProjection,
    avgAggregationSubProjection,
    castSubProjection,
  ],
};
