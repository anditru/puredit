import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import EmptyWidget from "@puredit/projections/EmptyWidget.svelte";
import { columnChain } from "../../columnChainProjection/main";

const pattern = parser.subPattern("columnChain")`${columnChain.copy()}`;
const widget = svelteProjection(EmptyWidget);

export const columnChainSubProjection: SubProjection = {
  name: "Column Chain",
  description: "Column chain.",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
