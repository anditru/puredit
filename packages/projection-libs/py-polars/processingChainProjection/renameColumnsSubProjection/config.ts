import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";
import EmptyWidget from "@puredit/projections/EmptyWidget.svelte";

import { agg } from "@puredit/parser";
import { columnMapping } from "../columnMappingSubProjection/config";

const columnMappings = agg("columnMappings", "dictionary", [columnMapping]);

const pattern = parser.subPattern("renameColumnsSubProjectionPattern")`rename(${columnMappings})`;

const widget = svelteProjection(Widget);
const emptyWidget = svelteProjection(EmptyWidget);

export const renameColumnsSubProjection: SubProjection = {
  name: "Rename columns function",
  description: "Rename columns in dataframe.",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [widget, emptyWidget],
};
