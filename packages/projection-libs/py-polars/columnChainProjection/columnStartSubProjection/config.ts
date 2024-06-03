import { contextVariable } from "@puredit/parser";
import { SubProjection, simpleProjection } from "@puredit/projections";
import { parser } from "../../parser";

const polars = contextVariable("pl");
const template = parser.subPattern("Polars:Column:ChainStart")`${polars}`;

const widget = simpleProjection(["Column"]);

export const columnStartSubProjection: SubProjection = {
  template,
  description: "Empty Projection for column chain start.",
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
