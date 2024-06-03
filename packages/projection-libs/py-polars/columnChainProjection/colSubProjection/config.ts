import { arg } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";

const columnName = arg("columnName", ["string"]);
export const template = parser.subPattern("Polars:Column:PickColumn")`col(${columnName})`;

const widget = svelteProjection(Widget);

export const colSubProjection: SubProjection = {
  template,
  description: "Pick a column to select",
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
