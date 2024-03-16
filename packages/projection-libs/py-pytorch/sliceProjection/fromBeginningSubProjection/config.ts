import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";
import { arg } from "@puredit/parser";

const endIndex = arg("endIndex", ["integer", "identifier"]);
const stepSize = arg("stepSize", ["integer", "identifier"]);
const pattern = parser.subPattern("fromBeginningSubProjectionPattern")`:${endIndex}:${stepSize}`;

const widget = svelteProjection(Widget);

export const fromBeginningSubProjection: SubProjection = {
  name: "Select from Beginning",
  description: "Select items from the beginning.",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
