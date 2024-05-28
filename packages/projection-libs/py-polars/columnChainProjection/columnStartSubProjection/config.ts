import { contextVariable } from "@puredit/parser";
import { simpleProjection } from "@puredit/simple-projection";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";

const polars = contextVariable("pl");
const pattern = parser.subPattern("columnChainStart")`${polars}`;

const widget = simpleProjection(["Column"]);

export const columnStartSubProjection: SubProjection = {
  name: "Polars:Column:ChainStart",
  description: "Empty Projection for column chain start.",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
