import { arg } from "@puredit/parser";
import { simpleProjection, SubProjection } from "@puredit/projections";
import { parser } from "../parser";

const columnName = arg("columnName", ["string"]);
const template = parser.subPattern("Polars:Column:Alias")`alias(${columnName})`;
const widget = simpleProjection(["as", columnName]);

export const aliasSubProjection: SubProjection = {
  template,
  description: "Set an alias for a column.",
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
