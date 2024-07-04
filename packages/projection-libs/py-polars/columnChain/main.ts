import { chain } from "@puredit/parser";
import type { RootProjection } from "@puredit/projections/types";
import { parser } from "../parser";
import { columnStartSubProjection } from "./chainStart";
import { colSubProjection } from "./pickColumn";
import { aliasSubProjection } from "./alias";
import { sumSubProjection } from "./sum";
import { avgSubProjection } from "./avg";
import { castSubProjection } from "./cast";

export const columnChain = chain(
  "columnChain",
  columnStartSubProjection.template,
  [
    colSubProjection.template,
    aliasSubProjection.template,
    sumSubProjection.template,
    avgSubProjection.template,
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
    sumSubProjection,
    avgSubProjection,
    castSubProjection,
  ],
};
