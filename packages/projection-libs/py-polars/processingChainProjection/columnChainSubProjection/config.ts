import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import { columnChain } from "../../columnChainProjection/main";

const template = parser.subPattern("Polars:Dataframe:ColumnChain")`${columnChain}`;

export const columnChainSubProjection: SubProjection = {
  template,
  description: "Column chain.",
  requiredContextVariables: [],
  segmentWidgets: [],
};
