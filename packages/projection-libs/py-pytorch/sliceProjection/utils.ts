import { Match } from "@puredit/parser";
import { ContextInformation } from "@puredit/projections";

export function getDimension(match: Match, context: ContextInformation) {
  const dimensionIndex = context.sliceMatches?.findIndex(
    (sliceMatch: Match) => sliceMatch.ID === match.ID
  );
  if (context.commentContext && dimensionIndex >= 0) {
    return Object.keys(context.commentContext)[dimensionIndex];
  } else {
    return undefined;
  }
}
