import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import Widget from "./Widget.svelte";
import EmptyWidget from "@puredit/projections/EmptyWidget.svelte";

import { parser } from "../../parser";
import { agg } from "@puredit/parser";
import { columnSubProjection } from "../columnSubProjection/config";
import { columnWithAliasSubProjection } from "../columnWithAliasSubProjection/config";
import { columnChainSubProjection } from "../columnChainSubProjection/config";

const columns = agg("columns", "argument_list", [
  columnSubProjection.pattern,
  columnWithAliasSubProjection.pattern,
  columnChainSubProjection.pattern,
]);
const selectFunction = parser.subPattern("selectFunction")`select${columns}`;

const widget = svelteProjection(Widget);
const emptyWidget = svelteProjection(EmptyWidget);

export const selectSubProjection: SubProjection = {
  name: "Select Column",
  description: "Select a column from a dataframe",
  pattern: selectFunction,
  requiredContextVariables: [],
  segmentWidgets: [widget, emptyWidget],
};
