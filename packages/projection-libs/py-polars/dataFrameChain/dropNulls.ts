import { simpleProjection, SubProjection } from "@puredit/projections";
import { parser } from "../parser";
import { columnSubProjection } from "./column";
import { agg, reference } from "@puredit/parser";

const columns = agg("columns", "argument_list", [
  columnSubProjection.template,
  reference("Polars:Column:Chain"),
]);
const template = parser.subPattern("Polars:Dataframe:DropNulls")`drop_nulls${columns}`;
const beginWidget = simpleProjection(["removing nulls in column(s)"]);
const endWidget = simpleProjection(["end columns"]);

export const dropNullsSubProjection: SubProjection = {
  template,
  description: "Drop nulls in certain columns of a dataframe.",
  requiredContextVariables: [],
  segmentWidgets: [beginWidget, endWidget],
};
