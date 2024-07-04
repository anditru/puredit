import { arg } from "@puredit/parser";
import { simpleProjection, SubProjection } from "@puredit/projections";
import { parser } from "../parser";

const sourceDataFrame = arg("sourceDataFrame", ["identifier"]);
export const template = parser.subPattern("Polars:Dataframe:ChainStart")`${sourceDataFrame}`;
const widget = simpleProjection(["Dataframe", sourceDataFrame, "transformed by"]);

export const selectStartSubProjection: SubProjection = {
  template,
  description: "Dataframe to transform.",
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
