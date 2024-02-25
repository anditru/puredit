import { arg, contextVariable } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections/svelte";
import type { RootProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";

const table = contextVariable("table");
const columnTarget = arg("columnTarget", ["string"]);
const columnSource = arg("columnSource", ["string"]);
const direction = arg("direction", ["string"]);

export const pattern = parser.statementPattern("trimData")`
${table}[${columnTarget}] = ${table}[${columnSource}].trim(${direction});
`;

export const widget = svelteProjection(Widget);

export const trimProjection: RootProjection = {
  name: "trim column",
  description: "Remove whitespace on the given sides of a column",
  pattern,
  requiredContextVariables: ["table"],
  segmentWidgets: [widget],
};
