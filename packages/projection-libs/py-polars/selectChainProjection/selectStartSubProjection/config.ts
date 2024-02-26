import { arg } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import FilterProjection from "./Widget.svelte";

const sourceDataFrame = arg("sourceDataFrame", ["identifier"]);
export const chainStart = parser.subPattern("chainStart")`${sourceDataFrame}`;

export const widget = svelteProjection(FilterProjection);

export const selectStartSubProjection: SubProjection = {
  name: "Select Chain Start",
  description: "Dataframe to select from",
  pattern: chainStart,
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
