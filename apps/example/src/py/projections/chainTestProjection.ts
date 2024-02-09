import { arg, chain } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections/svelte";
import type { Projection } from "@puredit/projections/types";
import { pythonParser } from "./parser";
import ChainTestProjection from "./ChainTestProjection.svelte";

const selectCondition = arg("selectCondition", ["string"]);
const selectFunction = pythonParser.subPattern("selectFunction")`
select(${selectCondition})
`;

const filterCondition = arg("filterCondition", ["number"]);
const fitlerFunction = pythonParser.subPattern("filterFunction")`
filter(${filterCondition})
`;

const sourceDataFrame = arg("sourceDataFrame", ["identifier"]);
const targetDataFrame = arg("targetDataFrame", ["identifier"]);
const baseDataFrame = pythonParser.expressionPattern("baseDataFrame")`${sourceDataFrame}`;
const processingChain = chain("processingChain", baseDataFrame, [selectFunction, fitlerFunction]);

export const pattern = pythonParser.statementPattern("select")`
${targetDataFrame} = ${processingChain}
`;

export const widget = svelteProjection(ChainTestProjection);

export const selectProjection: Projection = {
  name: "chainTest",
  description: "Test chaining",
  pattern,
  requiredContextVariables: [],
  widgets: [widget],
};
