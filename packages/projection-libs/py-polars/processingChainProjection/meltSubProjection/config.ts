import { parser } from "../../parser";
import { svelteProjection } from "@puredit/projections";
import type { SubProjection } from "@puredit/projections/types";
import BeginWidget from "./BeginWidget.svelte";
import ValueVarsWidget from "./ValueVarsWidget.svelte";
import EndWidget from "./EndWidget.svelte";
import { agg, arg } from "@puredit/parser";
import { columnSubProjection } from "../columnSubProjection/config";

const idVars = agg("idVars", "list", [columnSubProjection.template]);
const valueVars = agg("valueVars", "list", [columnSubProjection.template]);
const variableColumnName = arg("variableColumnName", ["string", "attribute", "identifier"]);
const valueColumnName = arg("valueColumnName", ["string", "attribute", "identifier"]);

const template = parser.subPattern(
  "Polars:Dataframe:Melt"
)`melt(id_vars=${idVars}, value_vars=${valueVars}, variable_name=${variableColumnName}, value_name=${valueColumnName})`;

const beginWidget = svelteProjection(BeginWidget);
const valueVarsWidget = svelteProjection(ValueVarsWidget);
const endWidget = svelteProjection(EndWidget);

export const meltSubProjection: SubProjection = {
  template,
  description: "Un-pivot a dataframe.",
  requiredContextVariables: [],
  segmentWidgets: [beginWidget, valueVarsWidget, endWidget],
};
