import { EditorState, StateField } from "@codemirror/state";
import { Decoration, EditorView } from "@codemirror/view";
import type { DecorationSet } from "@codemirror/view";
import { zip } from "@puredit/utils";
import { createPatternMap, PatternMatching } from "@puredit/parser";
import type { Match, Pattern } from "@puredit/parser";
import { pickedCompletion } from "@codemirror/autocomplete";
import type { CodeRange, ContextRange, PatternMap } from "@puredit/parser/match/types";
import type { Projection, ProjectionPluginConfig, SubProjection } from "./types";
import RawTemplate from "@puredit/parser/define/rawTemplate";

export interface ProjectionState {
  config: ProjectionPluginConfig;
  patternMap: PatternMap;
  decorations: DecorationSet;
  contextRanges: ContextRange[];
}

export function createProjectionState(
  state: EditorState,
  config: ProjectionPluginConfig
): ProjectionState {
  const patternMap = createPatternMap(config.projections.map((p) => p.pattern));
  const cursor = config.parser.parse(state.sliceDoc(0)).walk();
  const patternMatching = new PatternMatching(patternMap, cursor, config.globalContextVariables);
  const { matches, contextRanges } = patternMatching.execute();
  const decorations = updateProjections(config, Decoration.none, false, state, matches);
  return { config, patternMap, decorations, contextRanges };
}

export const projectionState = StateField.define<ProjectionState>({
  create() {
    throw new Error("projectionState must be created through init()");
  },
  update({ config, patternMap, decorations }, transaction) {
    const isCompletion = Boolean(transaction.annotation(pickedCompletion));
    decorations = decorations.map(transaction.changes);
    const state = transaction.state;
    // TODO: reuse previous tree for incremental parsing
    const cursor = config.parser.parse(state.sliceDoc(0)).walk();
    const patternMatching = new PatternMatching(patternMap, cursor, config.globalContextVariables);
    const { matches, contextRanges } = patternMatching.execute();
    decorations = updateProjections(config, decorations, isCompletion, state, matches);

    // TODO: figure out a way to incrementally match changes, to avoid
    // rematching the whole tree.
    /*transaction.changes.iterChangedRanges((_fromA, _toA, fromB, toB) => {
      let matches = findPatterns(
        patternMap,
        tree.cursor(fromB),
        state.doc,
        toB
      );
      decorations = updateProjections(decorations, true, state, matches);
    });*/

    return { config, patternMap, decorations, contextRanges };
  },
  provide: (f) => EditorView.decorations.from(f, (state) => state.decorations),
});

function updateProjections(
  config: ProjectionPluginConfig,
  decorations: DecorationSet,
  isCompletion: boolean,
  state: EditorState,
  matches: Match[]
): DecorationSet {
  const projectionMap = new Map<Pattern, Projection>(config.projections.map((p) => [p.pattern, p]));
  const subProjectionMap = new Map<RawTemplate, SubProjection>(
    config.subProjections.map((p) => [p.pattern, p])
  );

  let newDecorations = Decoration.none;
  const contexts: object[] = [config.globalContextValues];
  const contextBounds: number[] = [];

  for (const match of matches) {
    if (contextBounds.length && match.from >= contextBounds[contextBounds.length - 1]) {
      contexts.pop();
      contextBounds.pop();
    }
    let projection: Projection | SubProjection = projectionMap.get(match.pattern);
    if (!projection) {
      projection = subProjectionMap.get(match.pattern.template);
      if (!projection) {
        continue;
      }
    }
    const { widgets, contextProvider } = projection;
    const context = Object.assign({}, ...contexts);
    if (contextProvider) {
      contexts.push(contextProvider(match, state.doc, Object.assign({}, context)));
      contextBounds.push(match.to);
    }
    const ranges = removeBlockAndChainsFromRange(
      match.from,
      match.to,
      match.blockRanges.concat(match.chainRanges)
    );
    for (const [{ from, to }, Widget] of zip(ranges, widgets)) {
      let found = false;
      decorations.between(from, to, (a, b, dec) => {
        const widget = dec.spec.widget;
        if ((a === from || b === to) && widget instanceof Widget) {
          widget.set(match, context, state);
          found = true;
          newDecorations = newDecorations.update({
            add: [dec.range(from, to)],
          });
          return false;
        }
      });
      if (!found) {
        newDecorations = newDecorations.update({
          add: [
            Decoration.replace({
              widget: new Widget(isCompletion, match, context, state),
            }).range(from, to),
          ],
        });
      }
    }
  }
  return newDecorations;
}

interface Range {
  from: number;
  to: number;
}

/**
 * Splits a range into subranges that do not cover a given list of blocks.
 * @param from Start of the original range.
 * @param to End of the original range.
 * @param rangesToRemove A sorted list of rangesToRemove to exclude from the range.
 */
function removeBlockAndChainsFromRange(
  from: number,
  to: number,
  rangesToRemove: CodeRange[]
): Range[] {
  const ranges: Range[] = [];
  rangesToRemove.sort((rangeA, rangeB) => {
    if (rangeA.from < rangeB.from) {
      return -1;
    } else if (rangeA.from > rangeB.from) {
      return 1;
    }
    return 0;
  });

  for (const rangeToRemove of rangesToRemove) {
    if (rangeToRemove.from !== from) {
      ranges.push({ from, to: rangeToRemove.from });
    }
    from = rangeToRemove.to;
  }
  if (from < to) {
    ranges.push({ from, to });
  }
  return ranges;
}
