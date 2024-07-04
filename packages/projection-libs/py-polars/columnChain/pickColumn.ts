import { arg } from "@puredit/parser";
import { simpleProjection, SubProjection } from "@puredit/projections";
import { parser } from "../parser";

const columnName = arg("columnName", ["string"]);
const template = parser.subPattern("Polars:Column:PickColumn")`col(${columnName})`;
const widget = simpleProjection([columnName]);

export const colSubProjection: SubProjection = {
  template,
  description: "Pick a column to select.",
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
