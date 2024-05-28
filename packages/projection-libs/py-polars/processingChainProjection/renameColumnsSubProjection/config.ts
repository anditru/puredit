import { svelteProjection } from "@puredit/projections/svelte";
import { simpleProjection } from "@puredit/simple-projection";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";
import { agg } from "@puredit/parser";
import { columnMapping } from "../columnMappingSubProjection/config";

const columnMappings = agg("columnMappings", "dictionary", [columnMapping]);
const pattern = parser.subPattern("renameColumnsSubProjectionPattern")`rename(${columnMappings})`;

const beginWidget = svelteProjection(Widget);
const endWidget = simpleProjection(["end columns"]);

export const renameColumnsSubProjection: SubProjection = {
  name: "Polars:RenameColumns",
  description: "Rename columns in dataframe.",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [beginWidget, endWidget],
};
