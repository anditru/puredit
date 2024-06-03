import { svelteProjection } from "@puredit/projections";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";
import { arg } from "@puredit/parser";

const columnName = arg("columnName", ["string"]);
const alias = arg("alias", ["string"]);
export const template = parser.subPattern("Polars:ColumnMapping")`${columnName}: ${alias}`;

const widget = svelteProjection(Widget);

export const columnMappingSubProjection: SubProjection = {
  template,
  description: "Map a column name to an alias.",
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
