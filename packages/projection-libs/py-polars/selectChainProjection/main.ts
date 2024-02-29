import { arg, chain } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections/svelte";
import type { RootProjection } from "@puredit/projections/types";
import { parser } from "../parser";
import EmptyWidget from "@puredit/projections/EmptyWidget.svelte";
import IntoWidget from "./IntoWidget.svelte";

import { selectStartSubProjection } from "./selectStartSubProjection/config";
import { selectSubProjection } from "./selectSubProjection/config";
import { columnSubProjection } from "./columnSubProjection/config";
import { columnWithAliasSubProjection } from "./columnWithAliasSubProjection/config";
import { filterSubProjection } from "./filterSubProjection/config";
import { dropNullsSubProjection } from "./dropNullsSubProjection/config";
import { groupBySubProjection } from "./groupBySubProjection/config";

const processingChain = chain("processingChain", selectStartSubProjection.pattern, [
  selectSubProjection.pattern,
  filterSubProjection.pattern,
  dropNullsSubProjection.pattern,
  groupBySubProjection.pattern,
]);

const targetDataFrame = arg("targetDataFrame", ["identifier"]);
const pattern = parser.statementPattern(
  "selectChainPattern"
)`${targetDataFrame} = (${processingChain})`;

const widget = svelteProjection(EmptyWidget);
const intoWidget = svelteProjection(IntoWidget);

export const selectChainProjection: RootProjection = {
  name: "Select Chain",
  description: "selelct columns and apply transformations",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [widget, widget],
  postfixWidget: intoWidget,
  subProjections: [
    selectStartSubProjection,
    selectSubProjection,
    columnSubProjection,
    columnWithAliasSubProjection,
    filterSubProjection,
    dropNullsSubProjection,
    groupBySubProjection,
  ],
};
