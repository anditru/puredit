import { simpleProjection, SubProjection } from "@puredit/projections";
import { parser } from "../parser";
import { agg, reference } from "@puredit/parser";
import { columnSubProjection } from "./column";

const columns = agg("columns", "argument_list", [
  columnSubProjection.template,
  reference("Polars:Column:Chain"),
]);
const template = parser.subPattern("Polars:Dataframe:DropColumns")`drop${columns}`;
const beginWidget = simpleProjection(["removing column(s)"]);
const endWidget = simpleProjection(["end columns"]);

export const dropColumnsSubProjection: SubProjection = {
  template,
  description: "Remove columns from a dataset.",
  requiredContextVariables: [],
  segmentWidgets: [beginWidget, endWidget],
};
