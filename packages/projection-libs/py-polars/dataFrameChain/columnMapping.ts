import { simpleProjection, SubProjection } from "@puredit/projections";
import { parser } from "../parser";
import { arg } from "@puredit/parser";

const columnName = arg("columnName", ["string"]);
const alias = arg("alias", ["string"]);
export const template = parser.subPattern("Polars:ColumnMapping")`${columnName}: ${alias}`;
const widget = simpleProjection([columnName, "to", alias]);

export const columnMappingSubProjection: SubProjection = {
  template,
  description: "Map a column name to an alias.",
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
