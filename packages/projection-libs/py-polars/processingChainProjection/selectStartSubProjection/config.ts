import { arg } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import FilterProjection from "./Widget.svelte";

const sourceDataFrame = arg("sourceDataFrame", ["identifier"]);
export const chainStart = parser.subPattern("chainStart")`${sourceDataFrame}`;

const widget = svelteProjection(FilterProjection);

export const selectStartSubProjection: SubProjection = {
  name: "Polars:Dataframe:StartDataframe",
  description: "Dataframe to transform.",
  pattern: chainStart,
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
