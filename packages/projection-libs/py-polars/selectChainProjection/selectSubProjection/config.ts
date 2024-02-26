import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import Widget from "./Widget.svelte";
import EmptyWidget from "@puredit/projections/EmptyWidget.svelte";

import { parser } from "../../parser";
import { agg } from "@puredit/parser";
import { column } from "./columnSubProjection/config";
import { columnWithAlias } from "./columnWithAliasSubProjection/config";
import { columnChain } from "../../columnChainProjection/main";

const columnChainPattern = parser.subPattern("columnChain")`${columnChain}`;
const columns = agg("columns", [column, columnWithAlias, columnChainPattern]);

const selectFunction = parser.subPattern("selectFunction")`select(${columns})`;

const widget = svelteProjection(Widget);
const emptyWidget = svelteProjection(EmptyWidget);

export const selectSubProjection: SubProjection = {
  name: "Select Column",
  description: "Select a column from a dataframe",
  pattern: selectFunction,
  requiredContextVariables: [],
  segmentWidgets: [widget, emptyWidget],
};
