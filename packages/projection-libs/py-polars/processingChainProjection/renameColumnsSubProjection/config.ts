import { svelteProjection, simpleProjection } from "@puredit/projections";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";
import { agg } from "@puredit/parser";
import { columnMappingSubProjection } from "../columnMappingSubProjection/config";

const columnMappings = agg("columnMappings", "dictionary", [columnMappingSubProjection.template]);
const template = parser.subPattern("Polars:RenameColumns")`rename(${columnMappings})`;

const beginWidget = svelteProjection(Widget);
const endWidget = simpleProjection(["end columns"]);

export const renameColumnsSubProjection: SubProjection = {
  template,
  description: "Rename columns in dataframe.",
  requiredContextVariables: [],
  segmentWidgets: [beginWidget, endWidget],
};
