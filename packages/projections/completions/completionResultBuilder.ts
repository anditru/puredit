import type { ContextVariableMap, RootProjection, SubProjection } from "../types";
import type { Completion } from "@codemirror/autocomplete";
import { indentString } from "@codemirror/language";
import { pickedCompletion } from "@codemirror/autocomplete";
import Fuse from "fuse.js";

export default class CompletionsBuilder {
  private indentation!: number;
  private contextVariables!: ContextVariableMap;
  private delimiterToken = "";
  private rootProjections: RootProjection[] = [];
  private subProjections: SubProjection[] = [];
  private searchString: string;

  private completions: Completion[] = [];
  private boost = 100;

  setIndendation(indentation: number): CompletionsBuilder {
    this.indentation = indentation;
    return this;
  }

  setContext(contextVariables: ContextVariableMap): CompletionsBuilder {
    this.contextVariables = contextVariables;
    return this;
  }

  setDelimiterToken(delimiterToken: string) {
    this.delimiterToken = delimiterToken;
    return this;
  }

  setRootProjections(projections: Record<string, RootProjection[]>): CompletionsBuilder {
    this.rootProjections = Object.keys(projections).flatMap((key) => projections[key]);
    for (const projection of this.rootProjections) {
      this.subProjections = this.subProjections.concat(projection.subProjections);
    }
    return this;
  }

  setSeachString(searchString: string) {
    this.searchString = searchString;
    return this;
  }

  build(): Completion[] {
    let fittingProjections: (RootProjection | SubProjection)[] = [];
    fittingProjections = fittingProjections.concat(this.rootProjections);
    fittingProjections = fittingProjections.concat(this.subProjections);

    if (this.searchString) {
      fittingProjections = fuzzySearch<RootProjection | SubProjection>(
        fittingProjections,
        this.searchString
      );
    }

    for (const projection of fittingProjections) {
      this.processProjection(projection);
    }

    return this.completions;
  }

  private processProjection(projection: RootProjection | SubProjection) {
    const showOption = this.requiredContextExistsFor(projection);
    if (showOption) {
      this.completions.push(this.transformToCompletion(projection));
    }
  }

  private requiredContextExistsFor(projection: RootProjection | SubProjection): boolean {
    let requiredContextExists = true;
    for (const variable of projection.requiredContextVariables) {
      if (!Object.prototype.hasOwnProperty.call(this.contextVariables, variable)) {
        requiredContextExists = false;
        break;
      }
    }
    return requiredContextExists;
  }

  private transformToCompletion(projection: RootProjection | SubProjection): Completion {
    this.boost = Math.max(--this.boost, 1);
    return {
      label: projection.name,
      type: "projection",
      boost: this.searchString ? this.boost : 1,
      info: projection.description,
      apply: (view, completion, from, to) => {
        const selection = view.state.selection?.main;
        let replaceFrom = from;
        let replaceTo = to;
        if (selection) {
          replaceFrom = selection.from;
          replaceTo = selection.to;
        }
        view.dispatch({
          changes: {
            from: replaceFrom,
            to: replaceTo,
            insert:
              projection.pattern
                .toDraftString()
                .split("\n")
                .join("\n" + indentString(view.state, this.indentation)) + this.delimiterToken,
          },
          annotations: pickedCompletion.of(completion),
        });
      },
    };
  }
}

const fuseOptions = {
  includeScore: true,
  includeMatches: true,
  keys: [
    { name: "name", weight: 0.7 },
    { name: "description", weight: 0.3 },
  ],
  fieldNormWeight: 0,
  minMatchCharLength: 3,
  ignoreLocation: true,
};

function fuzzySearch<T>(projections: T[], seachString: string): T[] {
  const fuse = new Fuse(projections, fuseOptions);
  const results = fuse.search(seachString);
  return results.map((result) => result.item);
}
