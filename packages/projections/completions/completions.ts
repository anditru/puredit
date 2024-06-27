import type { Completion, CompletionContext } from "@codemirror/autocomplete";
import type { CompletionResult } from "@codemirror/autocomplete";
import { projectionState } from "../state/state";
import CompletionsBuilder from "./completionResultBuilder";
import { ContextVariableMap, Projection } from "..";
import { Decoration } from "@codemirror/view";
import { Match } from "@puredit/parser";
import AggregationDecorator from "@puredit/parser/pattern/decorators/aggregationDecorator";

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

  const line = completionContext.state.doc.lineAt(word.from);
  const whiteSpace = line.text.match(/^\s*/);
  const indentation = whiteSpace?.length ? whiteSpace[0] : "";

  const projectionStateField = completionContext.state.field(projectionState);
  const { config, contextVariableRanges, decorations } = projectionStateField;
  const contextVariables: ContextVariableMap = { ...config.globalContextVariables };
  for (const contextRange of contextVariableRanges) {
    if (contextRange.from <= word.from && contextRange.to >= word.to) {
      Object.assign(contextVariables, contextRange.contextVariables);
    }
  }

  let recommendedProjections: Projection[] = [];
  const cursorPos = completionContext.pos;

  let siblingPartPatterns: Projection[] | undefined;
  const decorationCursor = decorations.iter();
  while (decorationCursor.value) {
    const match: Match = decorationCursor.value.spec.widget.match;

    for (const [aggregationName, range] of Object.entries(match.aggregationToRangeMap)) {
      if (cursorPos >= range.from && cursorPos <= range.to) {
        const pattern = match.pattern as AggregationDecorator;
        const partPatterns = pattern.getPartPatternsFor(aggregationName);
        siblingPartPatterns = partPatterns.map(
          (partPattern) => config.projectionRegistry.projectionsByName[partPattern.name]
        );
        break;
      }
    }
    if (siblingPartPatterns) {
      break;
    } else {
      decorationCursor.next();
    }
  }
  if (siblingPartPatterns) {
    recommendedProjections = recommendedProjections.concat(siblingPartPatterns);
  }

  let closestPos = -1;
  let closestDec: Decoration | undefined;
  decorations.between(0, cursorPos, (from, to, dec) => {
    if (from < cursorPos && from > closestPos) {
      closestPos = from;
      closestDec = dec;
    }
  });
  if (closestDec) {
    const closestPattern = closestDec.spec.widget.match.pattern;
    const siblingLinkProjections =
      config.projectionRegistry.getSiblingLinkProjections(closestPattern);
    recommendedProjections = recommendedProjections.concat(siblingLinkProjections);
  }

  const selection = completionContext.state.selection?.main;
  let searchString = "";
  if (selection.from !== selection.to) {
    searchString = completionContext.state.doc.slice(selection.from, selection.to).toString();
  }

  let searchOptions: Completion[] = [];
  if (searchString) {
    const matchingProjections = config.projectionRegistry.search(searchString);
    if (matchingProjections.length) {
      const searchCompletionsBuilder = new CompletionsBuilder();
      searchOptions = searchCompletionsBuilder
        .setIndendation(indentation)
        .setContext(contextVariables)
        .setProjections(matchingProjections)
        .setCompletionSection({
          name: "Search Results",
          rank: 0,
        })
        .setSeachString(searchString)
        .build();
    }
  }

  let recommnededOptions: Completion[] = [];
  if (recommendedProjections.length) {
    const recommendedOptionsBuilder = new CompletionsBuilder();
    recommnededOptions = recommendedOptionsBuilder
      .setIndendation(indentation)
      .setContext(contextVariables)
      .setProjections(recommendedProjections)
      .setCompletionSection({
        name: "Recommended",
        rank: 1,
      })
      .build();
  }

  const allCompletionsBuilder = new CompletionsBuilder();
  const allOptions = allCompletionsBuilder
    .setIndendation(indentation)
    .setContext(contextVariables)
    .setProjections(config.projectionRegistry.projectionsAsArray)
    .setCompletionSection({
      name: "All Projections",
      rank: 2,
    })
    .build();

  return {
    from: word.from,
    options: [...searchOptions, ...recommnededOptions, ...allOptions],
    filter: false,
  };
}
