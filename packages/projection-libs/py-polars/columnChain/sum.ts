import { simpleProjection, SubProjection } from "@puredit/projections";
import { parser } from "../parser";

const template = parser.subPattern("Polars:Column:Sum")`sum()`;
const widget = simpleProjection(["summing up the values"]);

export const sumSubProjection: SubProjection = {
  template,
  description: "Sum up the values in an aggregated column.",
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
