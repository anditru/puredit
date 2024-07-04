import { parser } from "../parser";
import { simpleProjection, SubProjection } from "@puredit/projections";
import { agg, arg } from "@puredit/parser";
import { columnSubProjection } from "./column";

const idVars = agg("idVars", "list", [columnSubProjection.template]);
const valueVars = agg("valueVars", "list", [columnSubProjection.template]);
const variableColumnName = arg("variableColumnName", ["string", "attribute", "identifier"]);
const valueColumnName = arg("valueColumnName", ["string", "attribute", "identifier"]);

const template = parser.subPattern(
  "Polars:Dataframe:Melt"
)`melt(id_vars=${idVars}, value_vars=${valueVars}, variable_name=${variableColumnName}, value_name=${valueColumnName})`;

const beginWidget = simpleProjection(["un-pivoting with identifier column(s)"]);
const valueVarsWidget = simpleProjection(["and value variable column(s)"]);
const endWidget = simpleProjection([
  "name variable column",
  variableColumnName,
  "name value column",
  valueColumnName,
]);

export const meltSubProjection: SubProjection = {
  template,
  description: "Un-pivot a dataframe.",
  requiredContextVariables: [],
  segmentWidgets: [beginWidget, valueVarsWidget, endWidget],
};
