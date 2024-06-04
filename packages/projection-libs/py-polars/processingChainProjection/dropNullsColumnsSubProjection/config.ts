import { svelteProjection, simpleProjection } from "@puredit/projections";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";
import { columnSubProjection } from "../columnSubProjection/config";
import { agg, reference } from "@puredit/parser";

const columns = agg("columns", "argument_list", [
  columnSubProjection.template,
  reference("Polars:Column:Chain"),
]);
const template = parser.subPattern("Polars:Dataframe:DropNulls")`drop_nulls${columns}`;

const beginWidget = svelteProjection(Widget);
const endWidget = simpleProjection(["end columns"]);

export const dropNullsColumnsSubProjection: SubProjection = {
  template,
  description: "Drop nulls in certain columns of a dataframe.",
  requiredContextVariables: [],
  segmentWidgets: [beginWidget, endWidget],
};
