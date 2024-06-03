import { arg, contextVariable } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections";
import type { RootProjection } from "@puredit/projections/types";
import { parser } from "../parser";
import Widget from "./Widget.svelte";

const table = contextVariable("table");
const column = arg("column", ["string"]);
const direction = arg("direction", ["string"]);
const pattern = parser.statementPattern("DBSample:Trim")`
${table}.column(${column}).trim(${direction})
`;

const widget = svelteProjection(Widget);

export const trimProjection: RootProjection = {
  pattern,
  description: "Remove whitespace on the given sides of a column",
  requiredContextVariables: ["table"],
  segmentWidgets: [widget],
  subProjections: [],
};
