import { getIndentation } from "@codemirror/language";
import type { Completion, CompletionContext } from "@codemirror/autocomplete";
import type { CompletionResult } from "@codemirror/autocomplete";
import { projectionState } from "../state/state";
import CompletionsBuilder from "./completionResultBuilder";
import { ContextVariableMap, SubProjection } from "..";
import { Match } from "@puredit/parser";
import { toSubProjectionMap } from "../shared";
import AggregationDecorator from "@puredit/parser/pattern/decorators/aggregationDecorator";
import { loadAggregatableNodeTypeConfigFor } from "@puredit/language-config";

/**
 * Transforms the registered projections into suggestions for the code completion
 * @param completionContext
 * @returns
 */
export function completions(completionContext: CompletionContext): CompletionResult | null {
  const word = completionContext.matchBefore(/\w*/);
  if (!word || (word.from === word.to && !completionContext.explicit)) {
    return null;
  }

  const indentation = getIndentation(completionContext.state, word.from) || 0;

  const state = completionContext.state.field(projectionState);
  const { config, contextVariableRanges } = state;
  const contextVariables: ContextVariableMap = { ...config.globalContextVariables };
  for (const contextRange of contextVariableRanges) {
    if (contextRange.from <= word.from && contextRange.to >= word.to) {
      Object.assign(contextVariables, contextRange.contextVariables);
    }
  }

  let relevantChildProjections: SubProjection[] | undefined;
  let delimiterToken: string | undefined;
  const subProjectionsMap = toSubProjectionMap(config.projections);
  const decorationCursor = state.decorations.iter();
  while (decorationCursor.value) {
    const match: Match = decorationCursor.value.spec.widget.match;
    const cursorPosition = completionContext.pos;

    for (const [aggregationName, range] of Object.entries(match.aggregationToRangeMap)) {
      if (cursorPosition >= range.from && cursorPosition <= range.to) {
        const pattern = match.pattern as AggregationDecorator;
        const subPatterns = pattern.getPartPatternsFor(aggregationName);
        relevantChildProjections = subPatterns.map(
          (subPattern) => subProjectionsMap.get(subPattern.template)!
        );
        const aggregationPartRanges = match.aggregationToPartMatchesMap[aggregationName];
        const endLastPartMatch = aggregationPartRanges[aggregationPartRanges.length - 1].to;
        if (cursorPosition < endLastPartMatch) {
          const aggregationNodeType = pattern.getNodeTypeFor(aggregationName);
          const aggregatableNodeTypeConfig = loadAggregatableNodeTypeConfigFor(
            pattern.language,
            aggregationNodeType
          );
          delimiterToken = aggregatableNodeTypeConfig.delimiterToken;
        }
        break;
      }
    }

    if (relevantChildProjections) {
      break;
    } else {
      decorationCursor.next();
    }
  }

  const completionsBuilder = new CompletionsBuilder();
  completionsBuilder.setIndendation(indentation).setContext(contextVariables);
  let options: Completion[];
  if (relevantChildProjections) {
    if (delimiterToken) {
      completionsBuilder.setDelimiterToken(delimiterToken);
    }
    options = completionsBuilder.setSubProjections(relevantChildProjections).build();
  } else {
    options = completionsBuilder.setRootProjections(config.projections).build();
  }

  return {
    from: word.from,
    options,
  };
}
