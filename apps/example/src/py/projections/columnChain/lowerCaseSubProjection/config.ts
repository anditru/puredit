import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { pythonParser } from "../../parser";
import Widget from "./Widget.svelte";

export const pattern = pythonParser.subPattern("lowerCaseFunction")`toLowerCase()`;

export const widget = svelteProjection(Widget);

export const lowerCaseSubProjection: SubProjection = {
  name: "Lower Case Function",
  description: "Convert column name to lower case",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
