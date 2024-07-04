import { arg } from "@puredit/parser";
import { simpleProjection, SubProjection } from "@puredit/projections";
import { parser } from "../parser";

const columnName = arg("columnName", ["string"]);
const columnAlias = arg("columnAlias", ["identifier"]);
const template = parser.subPattern("Polars:ColumnWithAlias")`${columnAlias}=${columnName}`;
const widget = simpleProjection([columnName, "as", columnAlias]);

export const columnWithAliasSubProjection: SubProjection = {
  template,
  description: "Column with alias to select from a dataframe.",
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
