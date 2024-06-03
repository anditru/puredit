import { svelteProjection } from "@puredit/projections";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";

const template = parser.subPattern("Polars:Column:NameToLowerCase")`toLowerCase()`;
const widget = svelteProjection(Widget);

export const lowerCaseSubProjection: SubProjection = {
  template,
  description: "Convert column name to lower case.",
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
