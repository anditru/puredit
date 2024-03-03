import { parser } from "../parser";
import { svelteProjection } from "@puredit/projections/svelte";
import type { RootProjection } from "@puredit/projections/types";
import BeginWidget from "./BeginWidget.svelte";
import ValuesWidget from "./ValuesWidget.svelte";
import ColumnsWidget from "./ColumnsWidget.svelte";
import EndWidget from "./EndWidget.svelte";
import { agg, arg } from "@puredit/parser";
import { columnSubProjection } from "./columnSubProjection/config";

const baseDataFrame = arg("baseDataFrame", ["identifier"]);
const pivotDataFrame = arg("pivotDataFrame", ["identifier"]);
const index = agg("indexColumns", "list", [columnSubProjection.pattern]);
const values = agg("valueColumns", "list", [columnSubProjection.pattern]);
const columns = agg("columnColumns", "list", [columnSubProjection.pattern]);
const aggFunction = arg("aggFunction", ["string"]);
const pattern = parser.statementPattern(
  "pivotProjectionPattern"
)`${pivotDataFrame} = ${baseDataFrame}.pivot(index=[${index}], columns=[${columns}], values=[${values}], aggregate_function=${aggFunction})`;

const beginWidget = svelteProjection(BeginWidget);
const valuesWidget = svelteProjection(ValuesWidget);
const columnsWidget = svelteProjection(ColumnsWidget);
const endWidget = svelteProjection(EndWidget);

export const pivotProjection: RootProjection = {
  name: "Pivot Function",
  description: "Create a pivot table from a dataframe.",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [beginWidget, columnsWidget, valuesWidget, endWidget],
  subProjections: [columnSubProjection],
};
