import { chain } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections/svelte";
import type { RootProjection } from "@puredit/projections/types";
import { parser } from "../parser";

import { columnStartSubProjection } from "./columnStartSubProjection/config";
import { colSubProjection } from "./colSubProjection/config";
import { upperCaseSubProjection } from "./upperCaseSubProjection/config";
import { lowerCaseSubProjection } from "./lowerCaseSubProjection/config";
import { aliasSubProjection } from "./aliasSubProjection/config";
import { attributeSubProjection } from "./attributeSubProjection/config";
import { sumAggregationSubProjection } from "./sumAggregationSubProjection/config";
import { avgAggregationSubProjection } from "./avgAggregationSubProjection/config";
import { castSubProjection } from "./castSubProjection/config";

export const columnChain = chain("columnChain", columnStartSubProjection.pattern, [
  colSubProjection.pattern,
  upperCaseSubProjection.pattern,
  lowerCaseSubProjection.pattern,
  aliasSubProjection.pattern,
  attributeSubProjection.pattern,
  sumAggregationSubProjection.pattern,
  avgAggregationSubProjection.pattern,
  castSubProjection.pattern,
]);

const pattern = parser.statementPattern("columnChainPattern")`${columnChain}`;

export const columnChainProjection: RootProjection = {
  name: "Column Chain",
  description: "Pick a column and apply transfomrations to its name",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [],
  subProjections: [
    columnStartSubProjection,
    colSubProjection,
    upperCaseSubProjection,
    lowerCaseSubProjection,
    aliasSubProjection,
    attributeSubProjection,
    sumAggregationSubProjection,
    avgAggregationSubProjection,
    castSubProjection,
  ],
};
