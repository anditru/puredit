import { arg, agg } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections/svelte";
import type { RootProjection } from "@puredit/projections/types";
import { pythonParser } from "../parser";
import { column } from "./columnSubProjection";
import { columnWithAlias } from "./columnWithAliasSubProjection";
import ComplexSelectProjection from "./ComplexSelectProjection.svelte";
import FromIntoProjection from "./FromIntoProjection.svelte";

const targetDataFrame = arg("targetDataFrame", ["identifier"]);
const sourceDataFrame = arg("sourceDataFrame", ["identifier"]);
const columns = agg("columns", [column, columnWithAlias]);

export const pattern = pythonParser.statementPattern("select")`
${targetDataFrame}=${sourceDataFrame}.select(${columns})
`;

export const widget = svelteProjection(ComplexSelectProjection);
export const postfixWidget = svelteProjection(FromIntoProjection);

export const complexSelectProjection: RootProjection = {
  name: "Complex Select",
  description: "Select one or more columns",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [widget, postfixWidget],
};
