import { chain } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections/svelte";
import type { RootProjection } from "@puredit/projections/types";
import { pythonParser } from "../parser";
import EmptyWidget from "../../../EmptyWidget.svelte";
import { pattern as startPattern } from "./startSubProjection";
import { pattern as colPattern } from "./colSubProjection/config";
import { pattern as upperCasePattern } from "./upperCaseSubProjection/config";
import { pattern as lowerCasePattern } from "./lowerCaseSubProjection/config";
import { pattern as aliasPattern } from "./aliasSubProjection/config";
import { pattern as attributePattern } from "./attributeSubProjection/config";

export const columnChain = chain("columnChain", startPattern, [
  colPattern,
  upperCasePattern,
  lowerCasePattern,
  aliasPattern,
  attributePattern,
]);

const pattern = pythonParser.statementPattern("columnChainPattern")`${columnChain}`;

const widget = svelteProjection(EmptyWidget);

export const columnChainProjection: RootProjection = {
  name: "Column Chain",
  description: "Pick a column",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
