import { contextVariable } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";

const polars = contextVariable("pl");
const pattern = parser.subPattern("columnChainStart")`${polars}`;

export const columnStartSubProjection: SubProjection = {
  name: "Column Chain Start",
  description: "Empty Projection for column chain start",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [],
};
