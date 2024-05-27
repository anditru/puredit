import { svelteProjection } from "@puredit/projections/svelte";
import { simpleProjection } from "@puredit/simple-projection";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";
import { columnSubProjection } from "../columnSubProjection/config";
import { columnWithAliasSubProjection } from "../columnWithAliasSubProjection/config";
import { columnChainSubProjection } from "../columnChainSubProjection/config";
import { agg } from "@puredit/parser";

const columns = agg("columns", "argument_list", [
  columnSubProjection.pattern,
  columnWithAliasSubProjection.pattern,
  columnChainSubProjection.pattern,
]);
const pattern = parser.subPattern("dropNullsPattern")`drop_nulls${columns}`;

const beginWidget = svelteProjection(Widget);
const endWidget = simpleProjection(["end columns"]);

export const dropNullsColumnsSubProjection: SubProjection = {
  name: "Drop nulls",
  description: "Drop nulls in certain columns of dataframe",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [beginWidget, endWidget],
};
