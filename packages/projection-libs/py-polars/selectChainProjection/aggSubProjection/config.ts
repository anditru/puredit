import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";
import EmptyWidget from "@puredit/projections/EmptyWidget.svelte";

import { agg } from "@puredit/parser";
import { column } from "../columnSubProjection/config";
import { columnChain } from "../../columnChainProjection/main";

const columnChainPattern = parser.subPattern("columnChain")`${columnChain}`;
const columns = agg("columns", [column, columnChainPattern]);

const pattern = parser.subPattern("aggSubProjectionPattern")`agg(${columns})`;

export const widget = svelteProjection(Widget);
export const emptyWidget = svelteProjection(EmptyWidget);

export const aggSubProjection: SubProjection = {
  name: "Aggregate function",
  description: "Aggregate columns after group by",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [widget, emptyWidget],
};
