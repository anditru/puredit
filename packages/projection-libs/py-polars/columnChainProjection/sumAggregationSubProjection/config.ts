import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";

const pattern = parser.subPattern("sumAggregationSubProjectionPattern")`sum()`;

const widget = svelteProjection(Widget);

export const sumAggregationSubProjection: SubProjection = {
  name: "Sum aggregation",
  description: "Sum up the values in an aggregated column.",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
