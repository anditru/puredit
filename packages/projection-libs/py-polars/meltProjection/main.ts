import { parser } from "../parser";
import { svelteProjection } from "@puredit/projections/svelte";
import type { RootProjection } from "@puredit/projections/types";
import BeginWidget from "./BeginWidget.svelte";
import ValueVarsWidget from "./ValueVarsWidget.svelte";
import EndWidget from "./EndWidget.svelte";
import { agg, arg } from "@puredit/parser";
import { columnSubProjection } from "./columnSubProjection/config";

const baseDataFrame = arg("baseDataFrame", ["identifier"]);
const moltenDataFrame = arg("moltenDataFrame", ["identifier"]);
const idVars = agg("idVars", "list", [columnSubProjection.pattern]);
const valueVars = agg("valueVars", "list", [columnSubProjection.pattern]);
const variableColumnName = arg("variableColumnName", ["string"]);
const valueColumnName = arg("valueColumnName", ["string"]);

const pattern = parser.statementPattern(
  "meltProjectionPattern"
)`${moltenDataFrame} = ${baseDataFrame}.melt(id_vars=[${idVars}], value_vars=[${valueVars}], variable_name=${variableColumnName}, value_name=${valueColumnName})`;

const beginWidget = svelteProjection(BeginWidget);
const valueVarsWidget = svelteProjection(ValueVarsWidget);
const endWidget = svelteProjection(EndWidget);

export const meltProjection: RootProjection = {
  name: "Melt function",
  description: "Un-pivot a dataframe.",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [beginWidget, valueVarsWidget, endWidget],
  subProjections: [columnSubProjection],
};
