import { getIndentation } from "@codemirror/language";
import type { CompletionContext } from "@codemirror/autocomplete";
import type { CompletionResult } from "@codemirror/autocomplete";
import type { Context } from "@puredit/parser";
import { projectionState } from "../state/state";
import CompletionsBuilder from "./completionResultBuilder";

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

  const { config, contextRanges } = completionContext.state.field(projectionState);
  const context: Context = { ...config.globalContextVariables };
  for (const contextRange of contextRanges) {
    if (contextRange.from <= word.from && contextRange.to >= word.to) {
      Object.assign(context, contextRange.context);
    }
  }

  const completionsBuilder = new CompletionsBuilder();
  const options = completionsBuilder
    .setIndendation(indentation)
    .setContext(context)
    .setRootProjections(config.projections)
    .build();

  return {
    from: word.from,
    options,
  };
}
