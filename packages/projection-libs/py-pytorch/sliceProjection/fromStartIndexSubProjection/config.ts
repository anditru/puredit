import { svelteProjection } from "@puredit/projections";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";
import { arg } from "@puredit/parser";

const startIndex = arg("startIndex", ["integer", "identifier"]);
const stepSize = arg("stepSize", ["integer", "identifier"]);
const template = parser.subPattern("PyTorch:Tensor:Slice:FromIndex")`${startIndex}::${stepSize}`;

const widget = svelteProjection(Widget);

export const fromStartIndexSubProjection: SubProjection = {
  template,
  description: "Select items from a specific index until the end.",
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
