import type { Context } from "@puredit/parser";
import type { RootProjection, SubProjection } from "../types";
import type { Completion } from "@codemirror/autocomplete";
import { indentString } from "@codemirror/language";
import { pickedCompletion } from "@codemirror/autocomplete";

export default class CompletionsBuilder {
  private indentation: number;
  private context: Context;
  private rootProjections: RootProjection[];
  private subProjections: SubProjection[] = [];

  private completions: Completion[] = [];

  setIndendation(indentation: number): CompletionsBuilder {
    this.indentation = indentation;
    return this;
  }

  setContext(context: Context): CompletionsBuilder {
    this.context = context;
    return this;
  }

  setRootProjections(rootProjections: RootProjection[]): CompletionsBuilder {
    this.rootProjections = rootProjections;
    for (const projection of rootProjections) {
      this.subProjections = this.subProjections.concat(projection.subProjections);
    }
    return this;
  }

  build(): Completion[] {
    for (const rootProjection of this.rootProjections) {
      this.processProjection(rootProjection);
    }
    for (const subProjection of this.subProjections) {
      this.processProjection(subProjection);
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
      if (!Object.prototype.hasOwnProperty.call(this.context, variable)) {
        requiredContextExists = false;
        break;
      }
    }
    return requiredContextExists;
  }

  private transformToCompletion(projection: RootProjection | SubProjection): Completion {
    return {
      label: projection.name,
      type: "projection",
      boost: 1,
      info: projection.description,
      apply: (view, completion, from, to) => {
        view.dispatch({
          changes: {
            from,
            to,
            insert: projection.pattern
              .toDraftString()
              .split("\n")
              .join("\n" + indentString(view.state, this.indentation)),
          },
          annotations: pickedCompletion.of(completion),
        });
      },
    };
  }
}
