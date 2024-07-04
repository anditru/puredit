import { simpleProjection, SubProjection } from "@puredit/projections";
import { parser } from "../parser";
import { agg } from "@puredit/parser";
import { columnMappingSubProjection } from "./columnMapping";

const columnMappings = agg("columnMappings", "dictionary", [columnMappingSubProjection.template]);
const template = parser.subPattern("Polars:RenameColumns")`rename(${columnMappings})`;

const beginWidget = simpleProjection(["renaming column(s)"]);
const endWidget = simpleProjection(["end columns"]);

export const renameColumnsSubProjection: SubProjection = {
  template,
  description: "Rename columns in dataframe.",
  requiredContextVariables: [],
  segmentWidgets: [beginWidget, endWidget],
};
