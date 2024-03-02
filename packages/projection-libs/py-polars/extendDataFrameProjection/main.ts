import { parser } from "../parser";
import { svelteProjection } from "@puredit/projections/svelte";
import type { RootProjection } from "@puredit/projections/types";
import BeginWidget from "./BeginWidget.svelte";
import EndWidget from "./EndWidget.svelte";
import { agg, arg } from "@puredit/parser";
import { binColumnCompositionSubProjection } from "./binColumnCompositionSubProjection/config";

const extendedDataFrame = arg("extendedDataFrame", ["identifier"]);
const baseDataFrame = arg("baseDataFrame", ["identifier"]);
const columnCombinations = agg("columnCombinations", "argument_list", [
  binColumnCompositionSubProjection.pattern,
]);
const pattern = parser.statementPattern(
  "extendDataFrameProjectionPattern"
)`${extendedDataFrame} = ${baseDataFrame}.with_columns(${columnCombinations})`;

const beginWidget = svelteProjection(BeginWidget);
const endWidget = svelteProjection(EndWidget);

export const extendDataFrameProjection: RootProjection = {
  name: "Extend Dataframe",
  description: "Extend a dataframe with a set of columns.",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [beginWidget, endWidget],
  subProjections: [binColumnCompositionSubProjection],
};
