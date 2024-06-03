import { svelteProjection, simpleProjection } from "@puredit/projections";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";
import { agg } from "@puredit/parser";
import { columnSubProjection } from "../columnSubProjection/config";

const columns = agg("columns", "argument_list", [columnSubProjection.template]);
const template = parser.subPattern("Polars:Dataframe:GroupBy")`group_by${columns}`;

const beginWidget = svelteProjection(Widget);
const endWidget = simpleProjection(["end columns"]);

export const groupBySubProjection: SubProjection = {
  template,
  description: "Group rows of a dataframe.",
  requiredContextVariables: [],
  segmentWidgets: [beginWidget, endWidget],
};
