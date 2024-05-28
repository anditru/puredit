import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import UppercaseSubProjection from "./Widget.svelte";

const pattern = parser.subPattern("upperCaseFunction")`toUpperCase()`;
const widget = svelteProjection(UppercaseSubProjection);

export const upperCaseSubProjection: SubProjection = {
  name: "Polars:Column:NameToUpperCase",
  description: "Convert column name to upper case.",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
