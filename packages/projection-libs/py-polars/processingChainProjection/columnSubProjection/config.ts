import { arg } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";

const columnName = arg("columnName", ["string"]);
const pattern = parser.subPattern("column")`${columnName}`;

const widget = svelteProjection(Widget);

export const columnSubProjection: SubProjection = {
  name: "Polars:Column",
  description: "Column to select from a dataframe.",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
