import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";
import { arg } from "@puredit/parser";

const columnName = arg("columnName", ["string"]);
const alias = arg("alias", ["string"]);

export const columnMapping = parser.subPattern(
  "columnMappingSubProjectionPattern"
)`${columnName}: ${alias}`;

const widget = svelteProjection(Widget);

export const columnMappingSubProjection: SubProjection = {
  name: "Column mapping",
  description: "Map a column name to an alias.",
  pattern: columnMapping,
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
