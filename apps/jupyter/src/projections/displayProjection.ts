import { arg, contextVariable } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections/svelte";
import type { RootProjection } from "@puredit/projections/types";
import { pythonParser } from "./parser";
import DisplayProjection from "./DisplayProjection.svelte";

const dsl = contextVariable("dsl");
const columns = arg("columns", ["list"]);

export const pattern = pythonParser.statementPattern("displayColumns")`
${dsl}.display(${columns})
`;

export const widget = svelteProjection(DisplayProjection);

export const displayProjection: RootProjection = {
  name: "display columns",
  description: "Displays the given columns in Jupyter",
  pattern,
  requiredContextVariables: ["dsl"],
  segmentWidgets: [widget],
};
