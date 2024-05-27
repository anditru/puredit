import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import { columnChain } from "../../columnChainProjection/main";

const pattern = parser.subPattern("columnChainPatternWithCopy")`${columnChain.copy()}`;

export const columnChainSubProjection: SubProjection = {
  name: "Column Chain",
  description: "Column chain.",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [],
};
