import { arg, agg, AggregationCardinality } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections/svelte";
import type { Projection } from "@puredit/projections/types";
import { pythonParser } from "./parser";
import { simpleProjection } from "@puredit/simple-projection";
import SelectProjection from "./SelectProjection.svelte";

const columnName = arg("columnName", ["string"]);
const columnAlias = arg("columnAlias", ["identifier"]);
export const column = pythonParser.aggSubPattern("column")`${columnName}`;
export const columnWithAlias = pythonParser.aggSubPattern(
  "columnWithAlias"
)`${columnAlias}=${columnName}`;

const targetDataFrame = arg("targetDataFrame", ["identifier"]);
const sourceDataFrame = arg("sourceDataFrame", ["identifier"]);
const columns = agg("columns", [column, columnWithAlias], AggregationCardinality.OneToMany);

export const pattern = pythonParser.statementPattern("select")`
${targetDataFrame}=${sourceDataFrame}.select(${columns})
`;

export const widget = svelteProjection(SelectProjection);
const columnWidget = simpleProjection([columnName]);
const columnWithAliasWidget = simpleProjection([columnName, "as", columnAlias]);

export const selectProjection: Projection = {
  name: "select",
  description: "Select one or more columns",
  pattern,
  requiredContextVariables: [],
  widgets: [widget],
  partWidgetsMapping: {
    column: columnWidget,
    columnWithAlias: columnWithAliasWidget,
  },
};
