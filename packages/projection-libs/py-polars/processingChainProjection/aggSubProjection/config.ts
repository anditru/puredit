import { svelteProjection, simpleProjection } from "@puredit/projections";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";

import { agg } from "@puredit/parser";
import { columnSubProjection } from "../columnSubProjection/config";
import { columnChainSubProjection } from "../columnChainSubProjection/config";

const columns = agg("columns", "argument_list", [
  columnSubProjection.template,
  columnChainSubProjection.template,
]);

const template = parser.subPattern("Polars:Dataframe:Aggregate")`agg${columns}`;

const beginWidget = svelteProjection(Widget);
const endWidget = simpleProjection(["end columns"]);

export const aggSubProjection: SubProjection = {
  template,
  description: "Aggregate columns of a dataframe after a group by.",
  requiredContextVariables: [],
  segmentWidgets: [beginWidget, endWidget],
};
