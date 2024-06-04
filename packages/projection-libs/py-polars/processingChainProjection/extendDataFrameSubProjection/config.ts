import { parser } from "../../parser";
import { svelteProjection, simpleProjection } from "@puredit/projections";
import type { SubProjection } from "@puredit/projections/types";
import Widget from "./Widget.svelte";
import { agg, reference } from "@puredit/parser";
import { binColumnCompositionSubProjection } from "../binColumnCompositionSubProjection/config";

const columnCombinations = agg("columnCombinations", "argument_list", [
  binColumnCompositionSubProjection.template,
  reference("Polars:Column:Chain"),
]);
const template = parser.subPattern("Polars:Dataframe:Extend")`with_columns${columnCombinations}`;

const beginWidget = svelteProjection(Widget);
const endWidget = simpleProjection(["end columns"]);

export const extendDataFrameSubProjection: SubProjection = {
  description: "Extend a dataframe with a set of columns.",
  template,
  requiredContextVariables: [],
  segmentWidgets: [beginWidget, endWidget],
};
