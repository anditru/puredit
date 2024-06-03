import { arg } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";

const columnName = arg("columnName", ["identifier"]);
const columnAlias = arg("columnAlias", ["string"]);
const template = parser.subPattern("Polars:ColumnWithAlias")`${columnName}=${columnAlias}`;

const widget = svelteProjection(Widget);

export const columnWithAliasSubProjection: SubProjection = {
  template,
  description: "Column with alias to select from a dataframe.",
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
