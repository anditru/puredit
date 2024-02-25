import { arg, contextVariable } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections/svelte";
import type { RootProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";

const table = contextVariable("table");
const columnTarget = arg("columnTarget", ["string"]);
const columnSource = arg("columnSource", ["string"]);
const target = arg("target", ["string"]);
const replacement = arg("replacement", ["string"]);

export const pattern = parser.statementPattern("replateData")`
${table}[${columnTarget}] = ${table}[${columnSource}].replace(${target}, ${replacement});
`;

export const widget = svelteProjection(Widget);

export const replaceProjection: RootProjection = {
  name: "replace text in column",
  description: "Replaces all occurences of a text in a column",
  pattern,
  requiredContextVariables: ["table"],
  segmentWidgets: [widget],
};
