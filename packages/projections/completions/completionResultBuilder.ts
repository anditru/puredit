import type { ContextVariableMap } from "../types";
import type { Completion, CompletionSection } from "@codemirror/autocomplete";
import { pickedCompletion } from "@codemirror/autocomplete";
import Projection from "../state/projection";

/**
 * @class
 * Builds the completion options in the format required by codemirror from the projections
 * in the ProjectionRegistry. If a search string is provided by the user, it performs a fuzzy
 * search on the names and descriptions of the projections.
 */
export default class CompletionsBuilder {
  private indentation!: string;
  private contextVariables!: ContextVariableMap;
  private completionSection!: CompletionSection;
  private projections!: Projection[];
  private searchString = "";
  private aggregationDelimiterTokens: string[] = [];

  private completions: Completion[] = [];
  private boost = 100;

  setIndendation(indentation: string): CompletionsBuilder {
    this.indentation = indentation;
    return this;
  }

  setContext(contextVariables: ContextVariableMap): CompletionsBuilder {
    this.contextVariables = contextVariables;
    return this;
  }

  setCompletionSection(completionSection: CompletionSection) {
    this.completionSection = completionSection;
    return this;
  }

  setProjections(projections: Projection[]): CompletionsBuilder {
    this.projections = projections;
    return this;
  }

  setSeachString(searchString: string) {
    this.searchString = searchString;
    return this;
  }

  setAggegationDelimiterTokens(delimiterTokens: string[]) {
    this.aggregationDelimiterTokens = delimiterTokens;
    return this;
  }

  build(): Completion[] {
    this.projections.forEach((projection, index) => {
      const aggregationDelimiterToken = this.aggregationDelimiterTokens[index]
        ? this.aggregationDelimiterTokens[index]
        : "";
      this.processProjection(projection, aggregationDelimiterToken);
    });

    return this.completions;
  }

  private processProjection(projection: Projection, aggregationDelimiterToken: string) {
    const showOption = this.requiredContextExistsFor(projection);
    if (showOption) {
      this.completions.push(this.transformToCompletion(projection, aggregationDelimiterToken));
    }
  }

  private requiredContextExistsFor(projection: Projection): boolean {
    let requiredContextExists = true;
    for (const variable of projection.requiredContextVariables) {
      if (!Object.prototype.hasOwnProperty.call(this.contextVariables, variable)) {
        requiredContextExists = false;
        break;
      }
    }
    return requiredContextExists;
  }

  private transformToCompletion(
    projection: Projection,
    aggregationDelimiterToken: string
  ): Completion {
    this.boost = Math.max(--this.boost, 1);
    return {
      label: projection.name,
      type: "projection",
      section: this.completionSection,
      info: projection.description,
      boost: this.searchString ? this.boost : 1,
      apply: (view, completion, from, to) => {
        let insert = projection.pattern
          .toDraftString()
          .split("\n")
          .join("\n" + this.indentation);
        const selection = view.state.selection?.main;
        let replaceFrom = from;
        let replaceTo = to;
        if (selection.from !== selection.to) {
          replaceFrom = selection.from;
          replaceTo = selection.to;
        }
        if (replaceFrom > 0) {
          const characterLeft = view.state.doc.slice(replaceFrom - 1, replaceFrom).toString();
          const firstCharacter = insert[0];
          if (characterLeft === "." && firstCharacter === ".") {
            replaceFrom--;
          }
        }
        if (aggregationDelimiterToken) {
          insert += aggregationDelimiterToken;
        }
        view.dispatch({
          changes: {
            from: replaceFrom,
            to: replaceTo,
            insert,
          },
          annotations: pickedCompletion.of(completion),
        });
      },
    };
  }
}
