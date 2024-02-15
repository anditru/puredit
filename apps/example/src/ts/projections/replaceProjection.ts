import { arg, contextVariable } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections/svelte";
import type { RootProjection } from "@puredit/projections/types";
import { tsParser } from "./parser";
import ReplaceProjection from "./ReplaceProjection.svelte";

const table = contextVariable("table");
const columnTarget = arg("columnTarget", ["string"]);
const columnSource = arg("columnSource", ["string"]);
const target = arg("target", ["string"]);
const replacement = arg("replacement", ["string"]);

export const pattern = tsParser.statementPattern("replateData")`
${table}[${columnTarget}] = ${table}[${columnSource}].replace(${target}, ${replacement});
`;

export const widget = svelteProjection(ReplaceProjection);

export const replaceProjection: RootProjection = {
  name: "replace text in column",
  description: "Replaces all occurences of a text in a column",
  pattern,
  requiredContextVariables: ["table"],
  segmentWidgets: [widget],
};
