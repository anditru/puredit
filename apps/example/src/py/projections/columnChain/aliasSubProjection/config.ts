import { arg } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { pythonParser } from "../../parser";
import Widget from "./Widget.svelte";

const columnName = arg("columnName", ["string"]);
export const pattern = pythonParser.subPattern("aliasFunction")`alias(${columnName})`;

const widget = svelteProjection(Widget);

export const aliasSubProjection: SubProjection = {
  name: "Alias Function",
  description: "Set an alias for a column",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
