import { parser } from "../parser";
import { svelteProjection } from "@puredit/projections/svelte";
import {
  LineAlignment,
  type ContextInformation,
  type RootProjection,
} from "@puredit/projections/types";
import Widget from "./Widget.svelte";
import { Match, agg, arg } from "@puredit/parser";
import { integerPart } from "../common/integerPart/config";
import EmptyWidget from "@puredit/projections/EmptyWidget.svelte";

const tensor = arg("tensor", ["identifier"]);
const dimensions = agg("dimensions", "argument_list", [integerPart.pattern]);

const pattern = parser.statementPattern("permuteProjectionPattern")`${tensor}.permute${dimensions}`;

const widget = svelteProjection(Widget);
const emptyWidget = svelteProjection(EmptyWidget);

export const permuteProjection: RootProjection = {
  name: "Permute",
  description: "Permute the dimensions of a tensor.",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [widget, emptyWidget],
  subProjections: [integerPart],
  lineAlignment: LineAlignment.Top,
  contextProvider(match: Match, _, contextInformation: ContextInformation): ContextInformation {
    const commentContext = contextInformation.commentContext;
    if (!commentContext) {
      return { reorderedDimensions: null };
    }
    const permutation = match.aggregationToMatchesMap.dimensions.map((match) =>
      parseInt(match.node.text)
    );
    if (permutation.length !== commentContext.length) {
      return { reorderedDimensions: null };
    }
    const reorderedDimensions: string[] = new Array(permutation.length);
    for (let i = 0; i < permutation.length; i++) {
      const nextDimension = contextInformation.commentContext[permutation[i]];
      if (Number.isNaN(nextDimension)) {
        return { reorderedDimensions: null };
      }
      reorderedDimensions[i] = nextDimension;
    }
    return {
      reorderedDimensions,
    };
  },
};
