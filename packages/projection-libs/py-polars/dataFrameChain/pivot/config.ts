import { parser } from "../../parser";
import { simpleProjection, svelteProjection, SubProjection } from "@puredit/projections";
import { agg, arg } from "@puredit/parser";
import { columnSubProjection } from "../column";
import EndWidget from "./EndWidget.svelte";

const index = agg("indexColumns", "list", [columnSubProjection.template]);
const values = agg("valueColumns", "list", [columnSubProjection.template]);
const columns = agg("columnColumns", "list", [columnSubProjection.template]);
const aggFunction = arg("aggFunction", ["string"]);
const template = parser.subPattern(
  "Polars:Dataframe:Pivot"
)`pivot(index=${index}, columns=${columns}, values=${values}, aggregate_function=${aggFunction})`;

const beginWidget = simpleProjection(["creating pivot dataframe grouping by column(s)"]);
const valuesWidget = simpleProjection(["aggregating column(s)"]);
const columnsWidget = simpleProjection(["in ouput column(s)"]);
const endWidget = svelteProjection(EndWidget);

export const pivotSubProjection: SubProjection = {
  template,
  description: "Create a pivot table from a dataframe.",
  requiredContextVariables: [],
  segmentWidgets: [beginWidget, columnsWidget, valuesWidget, endWidget],
};
