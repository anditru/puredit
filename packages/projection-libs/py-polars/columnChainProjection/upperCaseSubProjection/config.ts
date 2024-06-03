import { svelteProjection } from "@puredit/projections";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import UppercaseSubProjection from "./Widget.svelte";

const template = parser.subPattern("Polars:Column:NameToUpperCase")`toUpperCase()`;
const widget = svelteProjection(UppercaseSubProjection);

export const upperCaseSubProjection: SubProjection = {
  template,
  description: "Convert column name to upper case.",
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
