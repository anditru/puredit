import { simpleProjection, SubProjection } from "@puredit/projections";
import { parser } from "../parser";
import { agg, reference } from "@puredit/parser";
import { columnSubProjection } from "./column";

const columns = agg("columns", "argument_list", [
  columnSubProjection.template,
  reference("Polars:Column:Chain"),
]);
const template = parser.subPattern("Polars:Dataframe:Aggregate")`agg${columns}`;
const beginWidget = simpleProjection(["aggregating column(s)"]);
const endWidget = simpleProjection(["end columns"]);

export const aggSubProjection: SubProjection = {
  template,
  description: "Aggregate columns of a dataframe after a group by.",
  requiredContextVariables: [],
  segmentWidgets: [beginWidget, endWidget],
};
