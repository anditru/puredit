import { simpleProjection, SubProjection } from "@puredit/projections";
import { parser } from "../parser";
import { agg, reference } from "@puredit/parser";
import { columnSubProjection } from "./column";
import { columnWithAliasSubProjection } from "./columnWithAlias";

const columns = agg("columns", "argument_list", [
  columnSubProjection.template,
  columnWithAliasSubProjection.template,
  reference("Polars:Column:Chain"),
]);
const template = parser.subPattern("Polars:Dataframe:SelectColumns")`select${columns}`;
const beginWidget = simpleProjection(["reading column(s)"]);
const endWidget = simpleProjection(["end columns"]);

export const selectSubProjection: SubProjection = {
  template,
  description: "Select columns from a dataframe.",
  requiredContextVariables: [],
  segmentWidgets: [beginWidget, endWidget],
};
