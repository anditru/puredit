import { arg } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { pythonParser } from "../../parser";
import ColumnWithAliasSubProjection from "./ColumnWithAliasSubProjection.svelte";

const columnName = arg("columnName", ["identifier"]);
const columnAlias = arg("columnAlias", ["string"]);
export const columnWithAlias = pythonParser.subPattern(
  "columnWithAlias"
)`${columnName}=${columnAlias}`;

const widget = svelteProjection(ColumnWithAliasSubProjection);

export const columnWithAliasSubProjection: SubProjection = {
  name: "Column",
  description: "Column to select from a table",
  pattern: columnWithAlias,
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
