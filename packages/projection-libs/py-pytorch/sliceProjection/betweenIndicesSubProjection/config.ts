import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";
import { arg } from "@puredit/parser";

const startIndex = arg("startIndex", ["integer", "identifier"]);
const endIndex = arg("endIndex", ["integer", "identifier"]);
const stepSize = arg("stepSize", ["integer", "identifier"]);
const pattern = parser.subPattern(
  "betweenIndicesSubProjectionPattern"
)`${startIndex}:${endIndex}:${stepSize}`;

const widget = svelteProjection(Widget);

export const betweenIndicesSubProjection: SubProjection = {
  name: "PyTorch:Tensor:Slice:BetweenIndices",
  description: "Select from a given index to a given index.",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
