import { arg } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";

const columnName = arg("columnName", ["string"]);
const template = parser.subPattern("Polars:Column")`${columnName}`;

const widget = svelteProjection(Widget);

export const columnSubProjection: SubProjection = {
  template,
  description: "Column to select from a dataframe.",
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
