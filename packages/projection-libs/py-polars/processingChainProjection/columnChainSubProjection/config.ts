import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import { columnChain } from "../../columnChainProjection/main";

const pattern = parser.subPattern("columnChainPatternWithCopy")`${columnChain.copy()}`;

export const columnChainSubProjection: SubProjection = {
  name: "Polars:Dataframe:ColumnChain",
  description: "Column chain.",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [],
};
