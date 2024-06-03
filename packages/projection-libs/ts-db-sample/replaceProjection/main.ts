import { arg, contextVariable } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections";
import type { RootProjection } from "@puredit/projections/types";
import { parser } from "../parser";
import Widget from "./Widget.svelte";

const table = contextVariable("table");
const columnTarget = arg("columnTarget", ["string"]);
const columnSource = arg("columnSource", ["string"]);
const target = arg("target", ["string"]);
const replacement = arg("replacement", ["string"]);

export const pattern = parser.statementPattern("DBSample:Replace")`
${table}[${columnTarget}] = ${table}[${columnSource}].replace(${target}, ${replacement});
`;

export const widget = svelteProjection(Widget);

export const replaceProjection: RootProjection = {
  pattern,
  description: "Replaces all occurences of a text in a column",
  requiredContextVariables: ["table"],
  segmentWidgets: [widget],
  subProjections: [],
};
