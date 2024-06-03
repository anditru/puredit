import { svelteProjection } from "@puredit/projections";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";

const template = parser.subPattern("Polars:Column:AggregationAverage")`avg()`;

const widget = svelteProjection(Widget);

export const avgAggregationSubProjection: SubProjection = {
  template,
  description: "Take the average of an agggregated column.",
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
