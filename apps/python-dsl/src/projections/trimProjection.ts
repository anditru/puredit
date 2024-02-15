import { arg, contextVariable } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections/svelte";
import type { RootProjection } from "@puredit/projections/types";
import { pythonParser } from "./parser";
import TrimProjection from "./TrimProjection.svelte";

const table = contextVariable("table");
const column = arg("column", ["string"]);
const direction = arg("direction", ["string"]);

export const pattern = pythonParser.statementPattern("trimData")`
${table}.column(${column}).trim(${direction})
`;

export const widget = svelteProjection(TrimProjection);

export const trimProjection: RootProjection = {
  name: "trim column",
  description: "Remove whitespace on the given sides of a column",
  pattern,
  requiredContextVariables: ["table"],
  segmentWidgets: [widget],
};
