import { arg, chain } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections/svelte";
import type { RootProjection } from "@puredit/projections/types";
import { pythonParser } from "../parser";
import EmptyWidget from "../../../EmptyWidget.svelte";
import { selectFunction } from "./selectFunction/selectSubProjection";
import { filterFunction } from "./filterFunction/filterSubProjection";
import { chainStart } from "./start/startSubProjection";
import IntoProjection from "./IntoSubProjection.svelte";

const processingChain = chain("processingChain", chainStart, [selectFunction, filterFunction]);

const targetDataFrame = arg("targetDataFrame", ["identifier"]);
const pattern = pythonParser.statementPattern(
  "selectChainPattern"
)`${targetDataFrame} = ${processingChain}`;

const widget = svelteProjection(EmptyWidget);
const intoWidget = svelteProjection(IntoProjection);

export const selectChainProjection: RootProjection = {
  name: "Select Chain",
  description: "selelct columns and apply transformations",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [widget],
  postfixWidget: intoWidget,
};
