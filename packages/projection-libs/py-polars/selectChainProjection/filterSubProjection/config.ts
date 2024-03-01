import { arg } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";

const filterColumn = arg("filterColumn", ["identifier"]);
const compareValue = arg("compareValue", ["integer"]);
export const filterFunction = parser.subPattern(
  "filterFunction"
)`filter(${filterColumn}=${compareValue})`;

const widget = svelteProjection(Widget);

export const filterSubProjection: SubProjection = {
  name: "Filter Function",
  description: "Filter selection result",
  pattern: filterFunction,
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
