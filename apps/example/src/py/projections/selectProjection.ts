import { arg, agg } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections/svelte";
import type { Projection } from "@puredit/projections/types";
import { pythonParser } from "./parser";
import SelectProjection from "./SelectProjection.svelte";

const columnName = arg("columnName", ["string"]);
const columnAlias = arg("columnAlias", ["identifier"]);
export const column = pythonParser.subPattern("column")`${columnName}`;
export const columnWithAlias = pythonParser.subPattern("columnWithAlias")`
${columnAlias}=${columnName}
`;

const targetDataFrame = arg("targetDataFrame", ["identifier"]);
const sourceDataFrame = arg("sourceDataFrame", ["identifier"]);
const columns = agg("columns", [column, columnWithAlias]);

export const pattern = pythonParser.statementPattern("select")`
${targetDataFrame}=${sourceDataFrame}.select(${columns})
`;

export const widget = svelteProjection(SelectProjection);

export const selectProjection: Projection = {
  name: "select",
  description: "Select one or more columns",
  pattern,
  requiredContextVariables: [],
  widgets: [widget],
};
