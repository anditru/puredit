import { svelteProjection } from "@puredit/projections";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";

const template = parser.subPattern("Polars:Column:AggregationSum")`sum()`;
const widget = svelteProjection(Widget);

export const sumAggregationSubProjection: SubProjection = {
  template,
  description: "Sum up the values in an aggregated column.",
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
