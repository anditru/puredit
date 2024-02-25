import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../../parser";
import Widget from "./Widget.svelte";

const pattern = parser.subPattern("lowerCaseFunction")`toLowerCase()`;
const widget = svelteProjection(Widget);

export const lowerCaseSubProjection: SubProjection = {
  name: "Lower Case Function",
  description: "Convert column name to lower case",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
