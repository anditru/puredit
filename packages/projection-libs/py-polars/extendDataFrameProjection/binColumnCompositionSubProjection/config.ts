import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";
import { arg, contextVariable } from "@puredit/parser";

const polars = contextVariable("pl");
const leftColumnName = arg("leftColumnName", ["string"]);
const rightColumnName = arg("rightColumnName", ["string"]);
const newColumnName = arg("newColumnName", ["string"]);

const pattern = parser.subPattern(
  "binColumnCompositionSubProjectionPattern"
)`(${polars}.col(${leftColumnName}) + ${polars}.col(${rightColumnName})).alias(${newColumnName})`;

const widget = svelteProjection(Widget);

export const binColumnCompositionSubProjection: SubProjection = {
  name: "Binary Column Composition",
  description: "Combine the values of two columns with a binary operator.",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
