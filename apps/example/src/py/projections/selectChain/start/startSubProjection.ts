import { arg } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { pythonParser } from "../../parser";
import FilterProjection from "./StartSubProjection.svelte";

const sourceDataFrame = arg("sourceDataFrame", ["identifier"]);
export const chainStart = pythonParser.subPattern("chainStart")`${sourceDataFrame}`;

export const widget = svelteProjection(FilterProjection);

export const startSubProjection: SubProjection = {
  name: "Start Dataframe",
  description: "Dataframe to select from",
  pattern: chainStart,
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
