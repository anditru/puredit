import { svelteProjection } from "@puredit/projections";
import type { SubProjection } from "@puredit/projections/types";
import BeginWidget from "./BeginWidget.svelte";
import EndWidget from "./EndWidget.svelte";

import { parser } from "../../parser";
import { agg, reference } from "@puredit/parser";
import { columnSubProjection } from "../columnSubProjection/config";
import { columnWithAliasSubProjection } from "../columnWithAliasSubProjection/config";

const columns = agg("columns", "argument_list", [
  columnSubProjection.template,
  columnWithAliasSubProjection.template,
  reference("Polars:Column:Chain"),
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
