import { arg } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { pythonParser } from "../../parser";
import Widget from "./Widget.svelte";

const columnName = arg("columnName", ["string"]);
export const pattern = pythonParser.subPattern("colFunction")`col(${columnName})`;

const widget = svelteProjection(Widget);

export const colSubProjection: SubProjection = {
  name: "Col Function",
  description: "Pick a column to select",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
