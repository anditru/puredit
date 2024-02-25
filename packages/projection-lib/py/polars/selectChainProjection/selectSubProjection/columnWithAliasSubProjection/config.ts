import { arg } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../../../parser";
import Widget from "./Widget.svelte";

const columnName = arg("columnName", ["identifier"]);
const columnAlias = arg("columnAlias", ["string"]);
export const columnWithAlias = parser.subPattern("columnWithAlias")`${columnName}=${columnAlias}`;

const widget = svelteProjection(Widget);

export const columnWithAliasSubProjection: SubProjection = {
  name: "Column with alias",
  description: "Column with alias to select from a table",
  pattern: columnWithAlias,
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
