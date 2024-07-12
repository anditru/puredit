import { EditorState, RangeSetBuilder, StateEffect, StateField } from "@codemirror/state";
import { Decoration, EditorView } from "@codemirror/view";
import type { DecorationSet, ViewUpdate } from "@codemirror/view";
import { PatternMatching } from "@puredit/parser";
import { pickedCompletion } from "@codemirror/autocomplete";
import type { ContextVariableRange, Match } from "@puredit/parser";
import type { ProjectionPluginConfig } from "../types";
import DecorationSetBuilder from "./decorationSetBuilder";
import { Extension } from "@puredit/declarative-projections";
import ProjectionRegistry from "../projectionRegistry";

import { logProvider } from "../../../logconfig";
import { analyzeTransaction } from "./lazyMatching";
const logger = logProvider.getLogger("projections.state.state");

export interface ProjectionState {
  config: ProjectionPluginConfig;
  decorations: DecorationSet;
  contextVariableRanges: ContextVariableRange[];
}

export function createProjectionState(
  state: EditorState,
  config: ProjectionPluginConfig
): ProjectionState {
  const cursor = config.parser.parse(state.sliceDoc(0)).walk();
  const patternMatching = new PatternMatching(
    config.projectionRegistry.rootProjectionPatternsByRootNodeType,
    cursor,
    config.globalContextVariables
  );
  const { matches, contextVariableRanges } = patternMatching.execute();

  const decorationSetBuilder = new DecorationSetBuilder();
  decorationSetBuilder
    .setProjectionPluginConfig(config)
    .setDecorations(Decoration.none)
    .setIsCompletion(false)
    .setState(state)
    .setMatches(matches);
  const decorations = decorationSetBuilder.build();

  return { config, decorations, contextVariableRanges };
}

export const updateListener = EditorView.updateListener.of((v: ViewUpdate) => {
  if (v.viewportChanged && !v.docChanged) {
    v.view.dispatch({
      effects: forceRecreateDecorationsEffect.of(true),
    });
  }
});

export const insertDeclarativeProjectionsEffect = StateEffect.define<Extension[]>();
export const removeProjectionPackagesEffect = StateEffect.define<string[]>();
export const forceRecreateDecorationsEffect = StateEffect.define<boolean>();

export const projectionState = StateField.define<ProjectionState>({
  create(): ProjectionState {
    throw new Error("ProjectionState must be created through init()");
  },

  update({ config, decorations, contextVariableRanges }, transaction) {
    const isCompletion = Boolean(transaction.annotation(pickedCompletion));
    let forceRematch = false;
    let forceRecreation = false;
    for (const effect of transaction.effects) {
      if (effect.is(removeProjectionPackagesEffect)) {
        logger.debug("removeProjectionPackagesEffect found. Updating projections");
        effect.value.forEach((packageName) => config.projectionRegistry.removePackage(packageName));
        forceRematch = true;
      } else if (effect.is(insertDeclarativeProjectionsEffect) && config.projectionCompiler) {
        logger.debug("insertDeclarativeProjectionsEffect found. Updating projections");
        config.projectionCompiler.compile(effect.value);
        forceRematch = true;
      } else if (effect.is(forceRecreateDecorationsEffect)) {
        logger.debug("forceRecreateDecorationsEffect found. Recreating decorations");
        forceRematch = true;
        forceRecreation = true;
      }
    }

    if (!transaction.docChanged && !transaction.selection && !forceRematch) {
      logger.debug("Rematching nothing");
      return { config, decorations, contextVariableRanges };
    }

    console.time("Analysis");
    const { unitsToRematch, unitsToInvalidate } = analyzeTransaction(
      transaction,
      config.parser,
      forceRematch
    );
    console.timeEnd("Analysis");

    decorations = decorations.map(transaction.changes);
    const newState = transaction.state;

    console.time("Matching");
    let allMatches: Match[] = [];
    let allContextVariableRanges: ContextVariableRange[] = [];
    for (const changedUnit of unitsToRematch) {
      const cursor = changedUnit.walk();
      const patternMatching = new PatternMatching(
        config.projectionRegistry.rootProjectionPatternsByRootNodeType,
        cursor,
        config.globalContextVariables
      );
      const { matches, contextVariableRanges } = patternMatching.execute();
      allMatches = allMatches.concat(matches);
      allContextVariableRanges = allContextVariableRanges.concat(contextVariableRanges);
    }
    logger.debug("Done rematching. Rebuilding projections");
    console.timeEnd("Matching");

    const decorationSetBuilder = new DecorationSetBuilder();
    decorationSetBuilder
      .setProjectionPluginConfig(config)
      .setDecorations(decorations)
      .setIsCompletion(isCompletion)
      .setState(newState)
      .setMatches(allMatches)
      .setNodesToInvalidate(unitsToInvalidate);
    let newDecorations = decorationSetBuilder.build();
    logger.debug("Done rebuilding projections");

    if (forceRecreation) {
      newDecorations = recreateDecorations(newDecorations, config.projectionRegistry, newState);
    }

    return { config, decorations: newDecorations, contextVariableRanges: allContextVariableRanges };
  },

  provide(field: StateField<ProjectionState>) {
    return EditorView.decorations.from(field, (state) => state.decorations);
  },
});

function recreateDecorations(
  decorations: DecorationSet,
  projectionRegistry: ProjectionRegistry,
  state: EditorState
): DecorationSet {
  const decIterator = decorations.iter();
  const newDecorations = new RangeSetBuilder<Decoration>();
  while (decIterator.value) {
    const dec = decIterator.value;
    const oldWidget = dec.spec.widget;

    // Save old state
    const range = { from: decIterator.from, to: decIterator.to };
    const match: Match = Object.assign({}, oldWidget.match);
    const contextInformation = Object.assign({}, oldWidget.context);
    const isCompletion = oldWidget.isCompletion;

    // Destroy old widget
    dec.spec.widget.destroy(dec.spec.widget.dom);

    // Create new
    const segmentWidgets = projectionRegistry.projectionsByName[match.pattern.name].segmentWidgets;
    const Widget = segmentWidgets.find((WidgetClass) => dec.spec.widget instanceof WidgetClass)!;
    newDecorations.add(
      range.from,
      range.to,
      Decoration.replace({
        widget: new Widget(range, isCompletion, match, contextInformation, state),
      })
    );
    decIterator.next();
  }
  return newDecorations.finish();
}
