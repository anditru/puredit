import { arg } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import FilterProjection from "./Widget.svelte";

const sourceDataFrame = arg("sourceDataFrame", ["identifier"]);
export const template = parser.subPattern("Polars:Dataframe:ChainStart")`${sourceDataFrame}`;

const widget = svelteProjection(FilterProjection);

export const selectStartSubProjection: SubProjection = {
  template,
  description: "Dataframe to transform.",
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
