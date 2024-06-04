import { svelteProjection, simpleProjection } from "@puredit/projections";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";
import { agg, reference } from "@puredit/parser";
import { columnSubProjection } from "../columnSubProjection/config";

const columns = agg("columns", "argument_list", [
  columnSubProjection.template,
  reference("Polars:Column:Chain"),
]);
const template = parser.subPattern("Polars:Dataframe:DropColumns")`drop${columns}`;

const beginWidget = svelteProjection(Widget);
const endWidget = simpleProjection(["end columns"]);

export const dropColumnsSubProjection: SubProjection = {
  template,
  description: "Remove columns from a dataset.",
  requiredContextVariables: [],
  segmentWidgets: [beginWidget, endWidget],
};
