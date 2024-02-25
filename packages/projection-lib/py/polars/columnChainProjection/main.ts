import { chain } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections/svelte";
import type { RootProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import EmptyWidget from "@puredit/projections/EmptyWidget.svelte";

import { columnStartSubProjection } from "./columnStartSubProjection/config";
import { colSubProjection } from "./colSubProjection/config";
import { upperCaseSubProjection } from "./upperCaseSubProjection/config";
import { lowerCaseSubProjection } from "./lowerCaseSubProjection/config";
import { aliasSubProjection } from "./aliasSubProjection/config";
import { attributeSubProjection } from "./attributeSubProjection/config";

export const columnChain = chain("columnChain", columnStartSubProjection.pattern, [
  colSubProjection.pattern,
  upperCaseSubProjection.pattern,
  lowerCaseSubProjection.pattern,
  aliasSubProjection.pattern,
  attributeSubProjection.pattern,
]);

const pattern = parser.statementPattern("columnChain")`${columnChain}`;
const widget = svelteProjection(EmptyWidget);

export const columnChainProjection: RootProjection = {
  name: "Column Chain",
  description: "Pick a column and apply transfomrations to its name",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [widget],
  subProjections: [
    columnStartSubProjection,
    colSubProjection,
    upperCaseSubProjection,
    lowerCaseSubProjection,
    aliasSubProjection,
    attributeSubProjection,
  ],
};
