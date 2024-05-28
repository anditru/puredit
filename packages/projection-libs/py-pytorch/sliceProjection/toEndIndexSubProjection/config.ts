import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";
import { arg } from "@puredit/parser";

const endIndex = arg("endIndex", ["integer", "identifier"]);
const stepSize = arg("stepSize", ["integer", "identifier"]);
const pattern = parser.subPattern("toEndIndexSubProjectionPattern")`:${endIndex}:${stepSize}`;

const widget = svelteProjection(Widget);

export const toEndIndexSubProjection: SubProjection = {
  name: "PyTorch:Tensor:Slice:UpToIndex",
  description: "Select items from the beginning up to a specified end index.",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
