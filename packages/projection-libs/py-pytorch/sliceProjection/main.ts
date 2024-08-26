import { parser } from "../parser";
import { svelteProjection } from "@puredit/projections";
import type { ContextInformation, RootProjection } from "@puredit/projections/types";
import BeginWidget from "./BeginWidget.svelte";
import EndWidget from "./EndWidget.svelte";
import { Match, agg } from "@puredit/parser";

import { toEndIndexSubProjection } from "./toEndIndexSubProjection/config";
import { fromStartIndexSubProjection } from "./fromStartIndexSubProjection/config";
import { betweenIndicesSubProjection } from "./betweenIndicesSubProjection/config";
import { singleItemSubProjection } from "./singleItemSubProjection/config";
import { startSubProjection } from "./startSubProjection/config";

const slices = agg(
  "slices",
  "subscript",
  [
    toEndIndexSubProjection.template,
    fromStartIndexSubProjection.template,
    betweenIndicesSubProjection.template,
    singleItemSubProjection.template,
  ],
  startSubProjection.template
);
const pattern = parser.expressionPattern("PyTorch:Tensor:Slice")`${slices}`;

const beginWidget = svelteProjection(BeginWidget);
const endWidget = svelteProjection(EndWidget);

export const sliceProjection: RootProjection = {
  pattern,
  description: "Extract a slice from a tensor.",
  requiredContextVariables: [],
  segmentWidgets: [beginWidget, endWidget],
  subProjections: [
    startSubProjection,
    toEndIndexSubProjection,
    fromStartIndexSubProjection,
    betweenIndicesSubProjection,
    singleItemSubProjection,
  ],
  contextProvider(match: Match, _, contextInformation: ContextInformation): ContextInformation {
    return {
      commentContext: contextInformation.commentContext,
      sliceMatches: match.aggregationToPartMatchesMap.slices,
    };
  },
};
