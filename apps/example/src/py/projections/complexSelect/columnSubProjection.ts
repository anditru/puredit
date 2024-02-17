import { arg } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { pythonParser } from "../parser";
import ColumnSubProjection from "./ColumnSubProjection.svelte";

const columnName = arg("columnName", ["string"]);
export const column = pythonParser.subPattern("column")`${columnName}`;

const widget = svelteProjection(ColumnSubProjection);

export const columnSubProjection: SubProjection = {
  name: "Column",
  description: "Column to select from a table",
  pattern: column,
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
