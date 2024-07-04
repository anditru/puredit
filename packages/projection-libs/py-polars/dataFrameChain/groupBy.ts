import { simpleProjection, SubProjection } from "@puredit/projections";
import { parser } from "../parser";
import { agg } from "@puredit/parser";
import { columnSubProjection } from "./column";

const columns = agg("columns", "argument_list", [columnSubProjection.template]);
const template = parser.subPattern("Polars:Dataframe:GroupBy")`group_by${columns}`;
const beginWidget = simpleProjection(["grouping by column(s)"]);
const endWidget = simpleProjection(["end columns"]);

export const groupBySubProjection: SubProjection = {
  template,
  description: "Group rows of a dataframe.",
  requiredContextVariables: [],
  segmentWidgets: [beginWidget, endWidget],
};
