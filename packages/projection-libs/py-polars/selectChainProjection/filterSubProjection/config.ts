import { arg } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";

const condition = arg("condition", ["comparison_operator"]);
export const filterFunction = parser.subPattern("filterFunction")`filter(${condition})`;

const widget = svelteProjection(Widget);

export const filterSubProjection: SubProjection = {
  name: "Filter Function",
  description: "Filter selection result",
  pattern: filterFunction,
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
