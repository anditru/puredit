import { svelteProjection } from "@puredit/projections";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";
import { arg } from "@puredit/parser";

const integer = arg("integer", ["integer"]);
const template = parser.subPattern("PyTorch:Tensor:Integer")`${integer}`;

const widget = svelteProjection(Widget);

export const integerPart: SubProjection = {
  template,
  description: "Integer part for aggregations.",
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
