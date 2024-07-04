import { simpleProjection, SubProjection } from "@puredit/projections";
import { parser } from "../parser";
import { arg, contextVariable } from "@puredit/parser";

const polars = contextVariable("pl");
const leftColumnName = arg("leftColumnName", ["string"]);
const rightColumnName = arg("rightColumnName", ["string"]);
const newColumnName = arg("newColumnName", ["string"]);
const template = parser.subPattern(
  "Polars:Dataframe:BinaryColumnComposition"
)`(${polars}.col(${leftColumnName}) + ${polars}.col(${rightColumnName})).alias(${newColumnName})`;
const widget = simpleProjection([
  newColumnName,
  "as row-wise sum of columns",
  leftColumnName,
  "and",
  rightColumnName,
]);

export const binColumnCompositionSubProjection: SubProjection = {
  template,
  description: "Combine the values of two columns with a binary operator.",
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
