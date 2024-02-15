import { arg, agg } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections/svelte";
import type { RootProjection } from "@puredit/projections/types";
import { pythonParser } from "./parser";
import SelectProjection from "./ComplexSelectProjection.svelte";

const columnName = arg("columnName", ["identifier"]);
const columnAlias = arg("columnAlias", ["string"]);
export const column = pythonParser.subPattern("column")`${columnName}`;
export const columnWithAlias = pythonParser.subPattern("columnWithAlias")`
${columnName}=${columnAlias}
`;

const targetDataFrame = arg("targetDataFrame", ["identifier"]);
const sourceDataFrame = arg("sourceDataFrame", ["identifier"]);
const columns = agg("columns", [column, columnWithAlias]);

export const pattern = pythonParser.statementPattern("select")`
${targetDataFrame}=${sourceDataFrame}.select(${columns})
`;

export const widget = svelteProjection(SelectProjection);

export const complexSelectProjection: RootProjection = {
  name: "Complex Select",
  description: "Select one or more columns",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
