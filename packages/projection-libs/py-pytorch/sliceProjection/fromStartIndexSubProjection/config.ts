import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";
import { arg } from "@puredit/parser";

const startIndex = arg("startIndex", ["integer", "identifier"]);
const stepSize = arg("stepSize", ["integer", "identifier"]);
const pattern = parser.subPattern("fromStartIndexSubProjectionPattern")`${startIndex}::${stepSize}`;

const widget = svelteProjection(Widget);

export const fromStartIndexSubProjection: SubProjection = {
  name: "PyTorch:Tensor:Slice:FromIndex",
  description: "Select items from a specific index until the end.",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
