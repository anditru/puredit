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
import { dropNullsColumnsSubProjection } from "./dropNullsColumnsSubProjection/config";
import { groupBySubProjection } from "./groupBySubProjection/config";
import { aggSubProjection } from "./aggSubProjection/config";
import { dropColumnsSubProjection } from "./dropColumnsSubProjection/config";
import { renameColumnsSubProjection } from "./renameColumnsSubProjection/config";
import { columnMappingSubProjection } from "./columnMappingSubProjection/config";
import { columnChainSubProjection } from "./columnChainSubProjection/config";
import { joinSubProjection } from "./joinSubProjection/config";

const processingChain = chain(
  "processingChain",
  selectStartSubProjection.pattern,
  [
    selectSubProjection.pattern,
    filterSubProjection.pattern,
    dropNullsSubProjection.pattern,
    dropNullsColumnsSubProjection.pattern,
    groupBySubProjection.pattern,
    aggSubProjection.pattern,
    dropColumnsSubProjection.pattern,
    renameColumnsSubProjection.pattern,
    joinSubProjection.pattern,
  ],
  1
);

const targetDataFrame = arg("targetDataFrame", ["identifier"]);
const pattern = parser.statementPattern(
  "selectChainPattern"
)`${targetDataFrame} = ${processingChain}`;

const widget = svelteProjection(EmptyWidget);
const intoWidget = svelteProjection(IntoWidget);

export const selectChainProjection: RootProjection = {
  name: "Processing Chain",
  description: "Transform a dataset",
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
    dropNullsColumnsSubProjection,
    groupBySubProjection,
    aggSubProjection,
    dropColumnsSubProjection,
    renameColumnsSubProjection,
    columnMappingSubProjection,
    columnChainSubProjection,
    joinSubProjection,
  ],
};
