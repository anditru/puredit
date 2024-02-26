import type { EditorState } from "@codemirror/state";
import { Decoration } from "@codemirror/view";
import type { DecorationSet } from "@codemirror/view";
import { zip } from "@puredit/utils";
import type { Match, Pattern } from "@puredit/parser";
import type { CodeRange, Context } from "@puredit/parser/match/types";
import type { Projection, ProjectionPluginConfig, RootProjection, SubProjection } from "../types";
import type { Template } from "@puredit/parser";
import type { ProjectionWidgetClass } from "../projection";
import AggregationDecorator from "@puredit/parser/pattern/decorators/aggregationDecorator";
import {
  loadAggregationDelimiterTokensFor,
  loadAggregationsConfigFor,
} from "@puredit/language-config";
import type { AggregatableNodeTypeConfig } from "@puredit/language-config";

export default class DecorationSetBuilder {
  private config: ProjectionPluginConfig;
  private decorations: DecorationSet;
  private isCompletion: boolean;
  private state: EditorState;
  private matches: Match[];

  private projectionMap: Map<Pattern, RootProjection>;
  private subProjectionMap: Map<Template, SubProjection>;
  private newDecorations = Decoration.none;
  private contextBounds: number[] = [];
  private contexts: object[] = [];

  setProjectionPluginConfig(config: ProjectionPluginConfig) {
    this.config = config;
    this.contexts = [config.globalContextValues];
    return this;
  }

  setDecorations(decorations: DecorationSet) {
    this.decorations = decorations;
    return this;
  }

  setIsCompletion(isCompletion: boolean) {
    this.isCompletion = isCompletion;
    return this;
  }

  setState(state: EditorState) {
    this.state = state;
    return this;
  }

  setMatches(matches: Match[]) {
    this.matches = matches;
    return this;
  }

  build(): DecorationSet {
    for (const match of this.matches) {
      this.removeContextOutOfBoundsFor(match);
      let projection: Projection;
      try {
        projection = this.getProjectionFor(match);
      } catch (error) {
        if (error instanceof NoProjectionFound) {
          continue;
        } else {
          throw error;
        }
      }

      const { segmentWidgets, prefixWidget, postfixWidget, contextProvider } = projection;
      const context = Object.assign({}, ...this.contexts);
      if (contextProvider) {
        this.extractContextFrom(match, contextProvider);
      }

      this.extractSegmentDecoratorsFor(match, segmentWidgets, context);

      if (prefixWidget) {
        this.extractPrefixDecoratorFor(match, prefixWidget, context);
      }

      if (postfixWidget) {
        this.extractPostfixDecoratorFor(match, postfixWidget, context);
      }
    }
    return this.newDecorations;
  }

  private removeContextOutOfBoundsFor(match: Match) {
    if (
      this.contextBounds.length &&
      match.from >= this.contextBounds[this.contextBounds.length - 1]
    ) {
      this.contexts.pop();
      this.contextBounds.pop();
    }
  }

  private extractContextFrom(match: Match, contextProvider) {
    this.contexts.push(contextProvider(match, this.state.doc, Object.assign({}, ...this.contexts)));
    this.contextBounds.push(match.to);
  }

  private getProjectionFor(match: Match): Projection {
    if (!this.projectionMap || !this.subProjectionMap) {
      this.initProjectionMaps();
    }

    let projection: Projection | undefined = this.projectionMap.get(match.pattern);
    if (!projection) {
      projection = this.subProjectionMap.get(match.pattern.template);
      if (!projection) {
        throw new NoProjectionFound();
      }
    }
    return projection;
  }

  private initProjectionMaps(): void {
    this.projectionMap = new Map(
      this.config.projections.map((p: RootProjection) => [p.pattern, p])
    );
    this.subProjectionMap = new Map(
      this.config.projections.flatMap((p: RootProjection) =>
        p.subProjections.map((s) => [s.pattern, s])
      )
    );
  }

  private extractSegmentDecoratorsFor(
    match: Match,
    widgets: ProjectionWidgetClass[],
    context: Context
  ) {
    const ranges = this.getActualRangesFor(match);

    for (const [range, Widget] of zip(ranges, widgets)) {
      try {
        this.updateExistsingSegmentWidgetForRange(range, match, context, Widget);
      } catch (error) {
        if (error instanceof NoWidgetFound) {
          this.createNewSegmentWidgetForRange(range, match, context, Widget);
        } else {
          throw error;
        }
      }
    }
  }

  private getActualRangesFor(match: Match): Range[] {
    let rangesToRemove = match.blockRanges
      .concat(match.chainRanges)
      .concat(match.aggregationRanges);
    rangesToRemove = this.sortByFrom(rangesToRemove);

    let ranges: Range[] = [];
    let currentFrom = match.from;
    for (const rangeToRemove of rangesToRemove) {
      if (rangeToRemove.from !== currentFrom) {
        ranges.push({ from: currentFrom, to: rangeToRemove.from });
      }
      currentFrom = rangeToRemove.to;
    }

    if (currentFrom < match.to) {
      ranges.push({ from: currentFrom, to: match.to });
    }

    this.removeWhitespaceFromRanges(ranges, match);
    ranges = ranges.filter((range) => range.from !== range.to);

    if (match.pattern instanceof AggregationDecorator) {
      ranges = this.removeSeparatorTokenRanges(ranges, match);
    }

    return ranges;
  }

  private sortByFrom(ranges: CodeRange[]): CodeRange[] {
    const sortedRanges = [...ranges];
    sortedRanges.sort((rangeA, rangeB) => {
      if (rangeA.from < rangeB.from) {
        return -1;
      } else if (rangeA.from > rangeB.from) {
        return 1;
      }
      return 0;
    });
    return sortedRanges;
  }

  private removeWhitespaceFromRanges(ranges: Range[], match: Match) {
    for (const range of ranges) {
      let relativeFrom = range.from - match.node.startIndex;
      let relativeTo = range.to - match.node.startIndex;

      const delimiterTokens = loadAggregationDelimiterTokensFor(match.pattern.language);
      const rangeText = match.node.text.slice(relativeFrom, relativeTo);
      let textPointer = 0;
      while (
        (/\s/g.test(rangeText.charAt(textPointer)) ||
          delimiterTokens.includes(rangeText.charAt(textPointer))) &&
        relativeFrom < relativeTo
      ) {
        textPointer++;
        relativeFrom++;
      }

      textPointer = rangeText.length - 1;
      while (
        (/\s/g.test(rangeText.charAt(textPointer)) ||
          delimiterTokens.includes(rangeText.charAt(textPointer))) &&
        relativeFrom < relativeTo
      ) {
        textPointer--;
        relativeTo--;
      }

      range.from = relativeFrom + match.node.startIndex;
      range.to = relativeTo + match.node.startIndex;
    }
  }

  private removeSeparatorTokenRanges(ranges: Range[], match: Match) {
    const aggregatableNodeTypes = loadAggregationsConfigFor(
      match.pattern.language
    ).aggregatableNodeTypes;
    const separatorTokens = Object.values(aggregatableNodeTypes).reduce(
      (separatorTokens: string[], nodeTypeConfig: AggregatableNodeTypeConfig) => {
        return separatorTokens.concat(nodeTypeConfig.delimiterToken);
      },
      []
    );
    return ranges.filter((range) => {
      const relativeFrom = range.from - match.node.startIndex;
      const relativeTo = range.to - match.node.startIndex;
      const trimmedRangeText = match.node.text.slice(relativeFrom, relativeTo).trim();
      return !separatorTokens.includes(trimmedRangeText);
    });
  }

  private updateExistsingSegmentWidgetForRange(
    range: Range,
    match: Match,
    context: Context,
    Widget: ProjectionWidgetClass
  ) {
    let found = false;
    this.decorations.between(range.from, range.to, (decorationFrom, decorationTo, decoration) => {
      const widget = decoration.spec.widget;
      if (
        (decorationFrom === range.from || decorationTo === range.to) &&
        widget instanceof Widget
      ) {
        widget.set(match, context, this.state);
        this.newDecorations = this.newDecorations.update({
          add: [decoration.range(range.from, range.to)],
        });
        found = true;
        return false;
      }
    });
    if (!found) {
      throw new NoWidgetFound();
    }
  }

  private createNewSegmentWidgetForRange(
    range: Range,
    match: Match,
    context: Context,
    Widget: ProjectionWidgetClass
  ) {
    this.newDecorations = this.newDecorations.update({
      add: [
        Decoration.replace({
          widget: new Widget(this.isCompletion, match, context, this.state),
        }).range(range.from, range.to),
      ],
    });
  }

  private extractPostfixDecoratorFor(
    match: Match,
    Widget: ProjectionWidgetClass,
    context: Context
  ) {
    try {
      this.updateExistsingPostfixWidgetFor(match, context, Widget);
    } catch (error) {
      if (error instanceof NoWidgetFound) {
        this.createNewPostfixWidgetFor(match, context, Widget);
      } else {
        throw error;
      }
    }
  }

  private updateExistsingPostfixWidgetFor(
    match: Match,
    context: Context,
    Widget: ProjectionWidgetClass
  ) {
    let found = false;
    this.decorations.between(match.from, match.to, (decorationFrom, decorationTo, decoration) => {
      const widget = decoration.spec.widget;
      if (
        (decorationFrom === match.from || decorationTo === match.to) &&
        widget instanceof Widget
      ) {
        widget.set(match, context, this.state);
        this.newDecorations = this.newDecorations.update({
          add: [decoration.range(match.to, match.to)],
        });
        found = true;
        return false;
      }
    });
    if (!found) {
      throw new NoWidgetFound();
    }
  }

  private createNewPostfixWidgetFor(match: Match, context: Context, Widget: ProjectionWidgetClass) {
    this.newDecorations = this.newDecorations.update({
      add: [
        Decoration.widget({
          widget: new Widget(this.isCompletion, match, context, this.state),
          side: 1000,
        }).range(match.to, match.to),
      ],
    });
  }

  private extractPrefixDecoratorFor(match: Match, Widget: ProjectionWidgetClass, context: Context) {
    try {
      this.updateExistsingPrefixWidgetFor(match, context, Widget);
    } catch (error) {
      if (error instanceof NoWidgetFound) {
        this.createNewPrefixWidgetFor(match, context, Widget);
      } else {
        throw error;
      }
    }
  }

  private updateExistsingPrefixWidgetFor(
    match: Match,
    context: Context,
    Widget: ProjectionWidgetClass
  ) {
    let found = false;
    this.decorations.between(match.from, match.to, (decorationFrom, decorationTo, decoration) => {
      const widget = decoration.spec.widget;
      if (
        (decorationFrom === match.from || decorationTo === match.to) &&
        widget instanceof Widget
      ) {
        widget.set(match, context, this.state);
        this.newDecorations = this.newDecorations.update({
          add: [decoration.range(match.from, match.from)],
        });
        found = true;
        return false;
      }
    });
    if (!found) {
      throw new NoWidgetFound();
    }
  }

  private createNewPrefixWidgetFor(match: Match, context: Context, Widget: ProjectionWidgetClass) {
    this.newDecorations = this.newDecorations.update({
      add: [
        Decoration.widget({
          widget: new Widget(this.isCompletion, match, context, this.state),
          side: -1000,
        }).range(match.from, match.from),
      ],
    });
  }
}

interface Range {
  from: number;
  to: number;
}

class NoProjectionFound extends Error {
  constructor(message?: string) {
    super(message);
  }
}

class NoWidgetFound extends Error {
  constructor(message?: string) {
    super(message);
  }
}
