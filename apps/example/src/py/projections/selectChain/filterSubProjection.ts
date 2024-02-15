import { arg } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { pythonParser } from "../parser";
import FilterProjection from "./FilterSubProjection.svelte";

const filterColumn = arg("filterColumn", ["identifier"]);
const compareValue = arg("compareValue", ["integer"]);
export const filterFunction = pythonParser.subPattern("filterFunction")`
filter(${filterColumn}=${compareValue})
`;

export const widget = svelteProjection(FilterProjection);

export const filterSubProjection: SubProjection = {
  name: "Filter Function",
  description: "Filter selection result",
  pattern: filterFunction,
  requiredContextVariables: [],
  widgets: [widget],
};
