import { svelteProjection } from "@puredit/projections";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";

const template = parser.subPattern("Polars:Dataframe:DropAllNulls")`drop_nulls()`;

const widget = svelteProjection(Widget);

export const dropNullsSubProjection: SubProjection = {
  template,
  description: "Drop all nulls in dataframe.",
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
