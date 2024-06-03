import { parser } from "../../parser";
import { svelteProjection } from "@puredit/projections";
import type { SubProjection } from "@puredit/projections";
import BeginWidget from "./BeginWidget.svelte";
import ValuesWidget from "./ValuesWidget.svelte";
import ColumnsWidget from "./ColumnsWidget.svelte";
import EndWidget from "./EndWidget.svelte";
import { agg, arg } from "@puredit/parser";
import { columnSubProjection } from "../columnSubProjection/config";

const index = agg("indexColumns", "list", [columnSubProjection.template]);
const values = agg("valueColumns", "list", [columnSubProjection.template]);
const columns = agg("columnColumns", "list", [columnSubProjection.template]);
const aggFunction = arg("aggFunction", ["string"]);
const template = parser.subPattern(
  "Polars:Dataframe:Pivot"
)`pivot(index=${index}, columns=${columns}, values=${values}, aggregate_function=${aggFunction})`;

const beginWidget = svelteProjection(BeginWidget);
const valuesWidget = svelteProjection(ValuesWidget);
const columnsWidget = svelteProjection(ColumnsWidget);
const endWidget = svelteProjection(EndWidget);

export const pivotSubProjection: SubProjection = {
  template,
  description: "Create a pivot table from a dataframe.",
  requiredContextVariables: [],
  segmentWidgets: [beginWidget, columnsWidget, valuesWidget, endWidget],
};
