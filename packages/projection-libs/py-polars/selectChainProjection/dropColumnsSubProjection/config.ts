import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";
import EmptyWidget from "@puredit/projections/EmptyWidget.svelte";
import { agg } from "@puredit/parser";
import { columnSubProjection } from "../columnSubProjection/config";
import { columnChainSubProjection } from "../columnChainSubProjection/config";

const columns = agg("columns", "argument_list", [
  columnSubProjection.pattern,
  columnChainSubProjection.pattern,
]);
const pattern = parser.subPattern("dropColumnsSubProjectionPattern")`drop${columns}`;

const widget = svelteProjection(Widget);
const emptyWidget = svelteProjection(EmptyWidget);

export const dropColumnsSubProjection: SubProjection = {
  name: "Drop columns function",
  description: "Remove columns from a dataset",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [widget, emptyWidget],
};
