import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";
import { arg } from "@puredit/parser";

const startIndex = arg("startIndex", ["integer", "identifier"]);
const stepSize = arg("stepSize", ["integer", "identifier"]);
const pattern = parser.subPattern("fromBeginningSubProjectionPattern")`${startIndex}::${stepSize}`;

const widget = svelteProjection(Widget);

export const untilEndSubProjection: SubProjection = {
  name: "Select until End",
  description: "Select items until the end.",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
