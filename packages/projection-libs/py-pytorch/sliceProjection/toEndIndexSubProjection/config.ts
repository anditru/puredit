import { svelteProjection } from "@puredit/projections";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";
import { arg } from "@puredit/parser";

const endIndex = arg("endIndex", ["integer", "identifier"]);
const stepSize = arg("stepSize", ["integer", "identifier"]);
const template = parser.subPattern("PyTorch:Tensor:Slice:UpToIndex")`:${endIndex}:${stepSize}`;

const widget = svelteProjection(Widget);

export const toEndIndexSubProjection: SubProjection = {
  template,
  description: "Select items from the beginning up to a specified end index.",
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
