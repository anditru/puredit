import { arg } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";

const columnName = arg("columnName", ["string"]);
const template = parser.subPattern("Polars:Column:Alias")`alias(${columnName})`;

const widget = svelteProjection(Widget);

export const aliasSubProjection: SubProjection = {
  template,
  description: "Set an alias for a column.",
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
