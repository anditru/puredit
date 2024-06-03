import { svelteProjection } from "@puredit/projections";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";
import { arg } from "@puredit/parser";

const startIndex = arg("startIndex", ["integer", "identifier"]);
const endIndex = arg("endIndex", ["integer", "identifier"]);
const stepSize = arg("stepSize", ["integer", "identifier"]);
const template = parser.subPattern(
  "PyTorch:Tensor:Slice:BetweenIndices"
)`${startIndex}:${endIndex}:${stepSize}`;

const widget = svelteProjection(Widget);

export const betweenIndicesSubProjection: SubProjection = {
  template,
  description: "Select from a given index to a given index.",
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
