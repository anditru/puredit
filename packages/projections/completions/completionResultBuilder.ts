import type { ContextVariableMap } from "../types";
import type { Completion, CompletionSection } from "@codemirror/autocomplete";
import { pickedCompletion } from "@codemirror/autocomplete";
import Projection from "../projection";

export default class CompletionsBuilder {
  private indentation!: string;
  private contextVariables!: ContextVariableMap;
  private completionSection!: CompletionSection;
  private delimiterToken = "";
  private projections!: Projection[];
  private searchString = "";

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

  setDelimiterToken(delimiterToken: string): CompletionsBuilder {
    this.delimiterToken = delimiterToken;
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

  build(): Completion[] {
    for (const projection of this.projections) {
      this.processProjection(projection);
    }

    return this.completions;
  }

  private processProjection(projection: Projection) {
    const showOption = this.requiredContextExistsFor(projection);
    if (showOption) {
      this.completions.push(this.transformToCompletion(projection));
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

  private transformToCompletion(projection: Projection): Completion {
    this.boost = Math.max(--this.boost, 1);
    return {
      label: projection.name,
      type: "projection",
      section: this.completionSection,
      boost: this.searchString ? this.boost : 1,
      info: projection.description,
      apply: (view, completion, from, to) => {
        const insert = projection.pattern
          .toDraftString()
          .split("\n")
          .join("\n" + this.indentation + this.delimiterToken);
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
