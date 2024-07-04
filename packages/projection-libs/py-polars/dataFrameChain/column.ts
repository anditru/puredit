import { arg } from "@puredit/parser";
import { simpleProjection, SubProjection } from "@puredit/projections";
import { parser } from "../parser";

const columnName = arg("columnName", ["string"]);
const template = parser.subPattern("Polars:Column")`${columnName}`;
const widget = simpleProjection([columnName]);

export const columnSubProjection: SubProjection = {
  template,
  description: "Column to select from a dataframe.",
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
