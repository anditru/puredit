import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { pythonParser } from "../../parser";
import UppercaseSubProjection from "./Widget.svelte";

export const pattern = pythonParser.subPattern("upperCaseFunction")`toUpperCase()`;

export const widget = svelteProjection(UppercaseSubProjection);

export const upperCaseSubProjection: SubProjection = {
  name: "Upper Case Function",
  description: "Convert column name to upper case",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
