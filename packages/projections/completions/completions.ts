/**
 * @module
 * Integrates the completions for projections into codemirror by providing
 * a single functions that can be included in the codemirror editor as an
 * extension.
 * @see completions
 */

import type { Completion, CompletionContext } from "@codemirror/autocomplete";
import type { CompletionResult } from "@codemirror/autocomplete";
import { projectionState } from "../state/stateField";
import CompletionsBuilder from "./completionResultBuilder";
import { ContextVariableMap, Projection } from "..";
import { Decoration } from "@codemirror/view";
import { Match } from "@puredit/parser";
import AggregationDecorator from "@puredit/parser/pattern/decorators/aggregationDecorator";
import { loadAggregationDelimiterTokenFor } from "@puredit/language-config/load";

/**
 * Transforms the registered projections into suggestions for the code completion
 * @param completionContext
 * @returns
 */
export function completions(completionContext: CompletionContext): CompletionResult | null {
  const word = completionContext.matchBefore(/\w*/);
  const selection = completionContext.state.selection?.main;
  if (!word) {
    return null;
  }
  if (word.from === word.to && (!selection || selection.from !== selection.to)) {
    return null;
  }

  let searchString = "";
  if (selection.from !== selection.to) {
    searchString = completionContext.state.doc.slice(selection.from, selection.to).toString();
  } else {
    searchString = completionContext.state.doc.slice(word.from, word.to).toString();
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

  let recommendedAggProjections: Projection[] = [];
  let delimiterTokens: string[] = [];
  const cursorPos = completionContext.pos;

  let siblingPartPatterns: Projection[] | undefined;
  let delimiterToken: string | undefined;
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
        const aggregatableNodeType = pattern.getNodeTypeFor(aggregationName);
        delimiterToken = loadAggregationDelimiterTokenFor(pattern.language, aggregatableNodeType);
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
    recommendedAggProjections = recommendedAggProjections.concat(siblingPartPatterns);
    delimiterTokens = Array(siblingPartPatterns.length).fill(delimiterToken);
  }

  let recommendedChainProjections: Projection[] = [];
  let closestFrom = -1;
  let closestTo = -1;
  let closestDec: Decoration | undefined;
  decorations.between(0, cursorPos, (from, to, dec) => {
    if (from < cursorPos && from > closestFrom) {
      closestFrom = from;
      closestTo = to;
      closestDec = dec;
    }
  });
  if (closestDec) {
    const textBetween = completionContext.state.doc.slice(closestTo, cursorPos).toString();
    if (!containsLettersOrDigits(textBetween)) {
      const closestPattern = closestDec.spec.widget.match.pattern;
      const siblingLinkProjections =
        config.projectionRegistry.getSiblingLinkProjections(closestPattern);
      recommendedChainProjections = recommendedChainProjections.concat(siblingLinkProjections);
    }
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
  if (recommendedAggProjections.length) {
    const recommendedOptionsBuilder = new CompletionsBuilder();
    const recommnededAggOptions = recommendedOptionsBuilder
      .setIndendation(indentation)
      .setContext(contextVariables)
      .setProjections(recommendedAggProjections)
      .setAggegationDelimiterTokens(delimiterTokens)
      .setCompletionSection({
        name: "Recommended",
        rank: 1,
      })
      .build();
    recommnededOptions = recommnededOptions.concat(recommnededAggOptions);
  }

  if (recommendedChainProjections.length) {
    const recommendedOptionsBuilder = new CompletionsBuilder();
    const recommnededChainOptions = recommendedOptionsBuilder
      .setIndendation(indentation)
      .setContext(contextVariables)
      .setProjections(recommendedChainProjections)
      .setCompletionSection({
        name: "Recommended",
        rank: 1,
      })
      .build();
    recommnededOptions = recommnededOptions.concat(recommnededChainOptions);
  }

  if (!completionContext.explicit && !recommnededOptions.length) {
    return null;
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

function containsLettersOrDigits(str: string): boolean {
  return /[a-zA-Z\d]/.test(str);
}
