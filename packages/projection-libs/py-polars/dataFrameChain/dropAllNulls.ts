import { simpleProjection, SubProjection } from "@puredit/projections";
import { parser } from "../parser";

const template = parser.subPattern("Polars:Dataframe:DropAllNulls")`drop_nulls()`;
const widget = simpleProjection(["removing nulls in all columns"]);

export const dropAllNullsSubProjection: SubProjection = {
  template,
  description: "Drop all nulls in dataframe.",
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
