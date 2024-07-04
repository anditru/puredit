import { simpleProjection, SubProjection } from "@puredit/projections";
import { parser } from "../parser";

const template = parser.subPattern("Polars:Column:Avg")`avg()`;
const widget = simpleProjection(["taking the average value"]);

export const avgSubProjection: SubProjection = {
  template,
  description: "Take the average of an agggregated column.",
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
