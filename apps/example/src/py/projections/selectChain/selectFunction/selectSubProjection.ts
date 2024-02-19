import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { pythonParser } from "../../parser";
import SelectSubProjection from "./SelectSubProjection.svelte";
import EmptyWidget from "../../../../EmptyWidget.svelte";
import { agg } from "@puredit/parser";
import { column } from "./columnSubProjection";
import { columnWithAlias } from "./columnWithAliasSubProjection";

const columns = agg("columns", [column, columnWithAlias]);
export const selectFunction = pythonParser.subPattern("selectFunction")`
select(${columns})
`;

export const widget = svelteProjection(SelectSubProjection);
export const emptyWidget = svelteProjection(EmptyWidget);

export const selectSubProjection: SubProjection = {
  name: "Select Column",
  description: "Select a column from a dataframe",
  pattern: selectFunction,
  requiredContextVariables: [],
  segmentWidgets: [widget, emptyWidget],
};
