import { simpleProjection, SubProjection } from "@puredit/projections";
import { parser } from "../parser";
import { arg } from "@puredit/parser";

const dataType = arg("dataType", ["identifier"]);
const template = parser.subPattern("Polars:Column:Cast")`cast(pl.${dataType})`;
const widget = simpleProjection(["casted to datatype", dataType]);

export const castSubProjection: SubProjection = {
  template,
  description: "Cast data to a certain datatype.",
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
