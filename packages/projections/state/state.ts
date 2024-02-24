import { EditorState, StateField } from "@codemirror/state";
import { Decoration, EditorView } from "@codemirror/view";
import type { DecorationSet } from "@codemirror/view";
import { createPatternMap, PatternMatching } from "@puredit/parser";
import { pickedCompletion } from "@codemirror/autocomplete";
import type { ContextRange, PatternsMap } from "@puredit/parser/match/types";
import type { ProjectionPluginConfig } from "../types";
import DecorationSetBuilder from "./decorationSetBuilder";

export interface ProjectionState {
  config: ProjectionPluginConfig;
  patternMap: PatternsMap;
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

  const decorationSetBuilder = new DecorationSetBuilder();
  decorationSetBuilder
    .setProjectionPluginConfig(config)
    .setDecorations(Decoration.none)
    .setIsCompletion(false)
    .setState(state)
    .setMatches(matches);
  const decorations = decorationSetBuilder.build();

  return { config, patternMap, decorations, contextRanges };
}

export const projectionState = StateField.define<ProjectionState>({
  create(): ProjectionState {
    throw new Error("ProjectionState must be created through init()");
  },

  update({ config, patternMap, decorations }, transaction) {
    const isCompletion = Boolean(transaction.annotation(pickedCompletion));
    decorations = decorations.map(transaction.changes);
    const state = transaction.state;

    // TODO: reuse previous tree for incremental parsing
    const cursor = config.parser.parse(state.sliceDoc(0)).walk();
    const patternMatching = new PatternMatching(patternMap, cursor, config.globalContextVariables);
    const { matches, contextRanges } = patternMatching.execute();

    const decorationSetBuilder = new DecorationSetBuilder();
    decorationSetBuilder
      .setProjectionPluginConfig(config)
      .setDecorations(decorations)
      .setIsCompletion(isCompletion)
      .setState(state)
      .setMatches(matches);
    decorations = decorationSetBuilder.build();

    return { config, patternMap, decorations, contextRanges };
  },

  provide(field: StateField<ProjectionState>) {
    return EditorView.decorations.from(field, (state) => state.decorations);
  },
});
