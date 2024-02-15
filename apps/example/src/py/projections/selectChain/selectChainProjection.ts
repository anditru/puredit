import { arg, chain } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections/svelte";
import type { Projection } from "@puredit/projections/types";
import { pythonParser } from "../parser";
import ChainTestProjection from "./SelectChainProjection.svelte";
import { selectFunction } from "./selectSubProjection";
import { filterFunction } from "./filterSubProjection";
import { chainStart } from "./startSubProjection";

const processingChain = chain("processingChain", chainStart, [selectFunction, filterFunction]);

const targetDataFrame = arg("targetDataFrame", ["identifier"]);
export const pattern = pythonParser.statementPattern("chainTestPattern")`
${targetDataFrame} = ${processingChain}
`;

export const widget = svelteProjection(ChainTestProjection);

export const selectChainProjection: Projection = {
  name: "Select Chain",
  description: "selelct columns and apply transformations",
  pattern,
  requiredContextVariables: [],
  widgets: [widget],
};
