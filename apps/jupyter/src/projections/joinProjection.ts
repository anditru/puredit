import { arg, contextVariable } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections";
import type { RootProjection } from "@puredit/projections/types";
import { pythonParser } from "./parser";
import JoinProjection from "./JoinProjection.svelte";

const dsl = contextVariable("dsl");
const sheet = contextVariable("sheet");
const columns = arg("columns", ["pattern_list"]);
const sheetRange = arg("sheetRange", ["string"]);
const targetColumn = arg("targetColumn", ["identifier"]);
const expression = arg("expression", ["string"]);
const aggregationMethod = arg("aggregationMethod", ["string"]);

export const pattern = pythonParser.statementPattern("joinAllColumnsFromSheet")`
${columns} = ${sheet}.join(${sheetRange}, ${targetColumn}, ${expression}, ${dsl}.AggregationMethod[${aggregationMethod}])
`;

export const widget = svelteProjection(JoinProjection);

export const joinProjection: RootProjection = {
  name: "join columns from sheet range",
  description: "Join all columns from a sheet range on another column",
  pattern,
  requiredContextVariables: ["dsl", "sheet"],
  segmentWidgets: [widget],
};
