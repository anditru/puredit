import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";

const pattern = parser.subPattern("avgAggregationSubProjectionPattern")`avg()`;

const widget = svelteProjection(Widget);

export const avgAggregationSubProjection: SubProjection = {
  name: "Average aggregation",
  description: "Take the average of an agggregated column",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
