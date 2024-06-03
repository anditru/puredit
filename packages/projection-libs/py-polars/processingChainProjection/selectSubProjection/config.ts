import { svelteProjection } from "@puredit/projections";
import type { SubProjection } from "@puredit/projections/types";
import BeginWidget from "./BeginWidget.svelte";
import EndWidget from "./EndWidget.svelte";

import { parser } from "../../parser";
import { agg } from "@puredit/parser";
import { columnSubProjection } from "../columnSubProjection/config";
import { columnWithAliasSubProjection } from "../columnWithAliasSubProjection/config";
import { columnChainSubProjection } from "../columnChainSubProjection/config";

const columns = agg("columns", "argument_list", [
  columnSubProjection.template,
  columnWithAliasSubProjection.template,
  columnChainSubProjection.template,
]);
const template = parser.subPattern("Polars:Dataframe:SelectColumns")`select${columns}`;

const beginWidget = svelteProjection(BeginWidget);
const endWidget = svelteProjection(EndWidget);

export const selectSubProjection: SubProjection = {
  template,
  description: "Select columns from a dataframe.",
  requiredContextVariables: [],
  segmentWidgets: [beginWidget, endWidget],
};
