import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";

const pattern = parser.subPattern("dropNullsPattern")`drop_nulls()`;

const widget = svelteProjection(Widget);

export const dropNullsSubProjection: SubProjection = {
  name: "Drop nulls",
  description: "Drop nulls in dataframe",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
