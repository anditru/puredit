import { arg } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { pythonParser } from "../parser";
import FilterProjection from "./SelectSubProjection.svelte";

const columnName1 = arg("columnName1", ["string"]);
const columnName2 = arg("columnName2", ["string"]);
export const selectFunction = pythonParser.subPattern("selectFunction")`
select(${columnName1}, ${columnName2})
`;

export const widget = svelteProjection(FilterProjection);

export const selectSubProjection: SubProjection = {
  name: "Select Column",
  description: "Select a column from a table",
  pattern: selectFunction,
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
