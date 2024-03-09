import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";
import { arg } from "@puredit/parser";

const integer = arg("integer", ["integer"]);
const pattern = parser.subPattern("integerPartPattern")`${integer}`;

const widget = svelteProjection(Widget);

export const integerPart: SubProjection = {
  name: "Integer Part",
  description: "Integer part for aggregations.",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
