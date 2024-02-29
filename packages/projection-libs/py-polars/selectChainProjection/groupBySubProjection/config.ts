import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";
import EmptyWidget from "@puredit/projections/EmptyWidget.svelte";
import { agg } from "@puredit/parser";
import { column } from "../columnSubProjection/config";

const columns = agg("columns", [column]);
const pattern = parser.subPattern("groupBySubProjectionPattern")`group_by(${columns})`;

export const widget = svelteProjection(Widget);
const emptyWidget = svelteProjection(EmptyWidget);

export const groupBySubProjection: SubProjection = {
  name: "Group by function",
  description: "Group rows",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [widget, emptyWidget],
};
