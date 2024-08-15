/**
 * @module
 * Provides the StateField holding the projections' state and the logic
 * to update and redraw the projections.
 */

import {
  EditorState,
  RangeSet,
  RangeSetBuilder,
  StateEffect,
  StateField,
  Transaction,
} from "@codemirror/state";
import { Decoration, EditorView } from "@codemirror/view";
import { DecorationSet, ViewUpdate } from "@codemirror/view";
import { PatternMatching } from "@puredit/parser";
import { pickedCompletion } from "@codemirror/autocomplete";
import type { ContextVariableRange, Match } from "@puredit/parser";
import type { ProjectionPluginConfig } from "../types";
import DecorationSetBuilder from "./decorationSetBuilder";
import { Extension } from "@puredit/declarative-projections";
import ProjectionRegistry from "./projectionRegistry";
import { analyzeTransactions } from "./lazyMatching";
import { Debouncer } from "./debouncing";

import { logProvider } from "../../../logconfig";
const logger = logProvider.getLogger("projections.state.stateField");

export interface ProjectionState {
  config: ProjectionPluginConfig;
  decorations: DecorationSet;
  contextVariableRanges: ContextVariableRange[];
  rematchingController: Debouncer;
}

/**
 * Creates the initial projection state after the editor is opened.
 * @param state
 * @param config
 */
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

  const rematchingController = Debouncer.getInstance();

  return { config, decorations, contextVariableRanges, rematchingController };
}

/**
 * @const
 * StateEffect to indicate that new declarative projections should be inserted into the ProjectionRegistry.
 * */
export const insertDeclarativeProjectionsEffect = StateEffect.define<Extension[]>();
/**
 * @const
 * StateEffect to indicate that some declarative projections should be removed from the ProjectionRegistry.
 */
export const removeProjectionPackagesEffect = StateEffect.define<string[]>();
/**
 * @const
 * StateEffect to indicate that the delay after which a reamtching should be triggered should be updated.
 */
export const updateDelayEffect = StateEffect.define<number>();
/**
 * @const
 * StateEffect to force redrawing all decorations. Should be avoided whenever possible since it also causes
 * a rematching of the entire document which might cause lags if the document is large enough.
 * Currently required when the user scrolls wide enough to change editor's viewport since codemirror detroys
 * decorations that are outside the viewport.
 */
export const forceRecreateDecorationsEffect = StateEffect.define<boolean>();
/**
 * @const
 * StateEffect to indicate that the rematching deply has ellapsed and therefore a lazy rematching should be
 * executed.
 */
export const rematchEffect = StateEffect.define();

export const projectionState = StateField.define<ProjectionState>({
  create(): ProjectionState {
    throw new Error("ProjectionState must be created through init()");
  },

  update(projectionState: ProjectionState, transaction: Transaction) {
    const config = projectionState.config;
    let forceRematch = false;
    let forceRecreation = false;
    for (const effect of transaction.effects) {
      if (effect.is(updateDelayEffect)) {
        const delay = transaction.effects.find((effect) => effect.is(updateDelayEffect))!.value;
        projectionState.rematchingController.setDelay(delay);
      }
      if (effect.is(removeProjectionPackagesEffect)) {
        logger.debug("removeProjectionPackagesEffect found. Updating projections");
        effect.value.forEach((packageName) => config.projectionRegistry.removePackage(packageName));
        forceRematch = true;
      }
      if (effect.is(insertDeclarativeProjectionsEffect) && config.projectionCompiler) {
        logger.debug("insertDeclarativeProjectionsEffect found. Updating projections");
        try {
          config.projectionCompiler.compile(effect.value);
        } catch (error: any) {
          logger.warn(error.message);
        }
        forceRematch = true;
      }
      if (effect.is(forceRecreateDecorationsEffect)) {
        logger.debug("forceRecreateDecorationsEffect found.");
        forceRematch = true;
        forceRecreation = true;
      }
    }

    if (forceRematch) {
      logger.debug("Calculating forced update");
      projectionState = calculateUpdate(
        projectionState,
        [transaction],
        forceRematch,
        forceRecreation
      );
    } else if (transaction.effects.some((effect) => effect.is(rematchEffect))) {
      logger.debug("Calculating lazy update");
      const rematchingController = projectionState.rematchingController;
      const transactions = rematchingController.getBufferedTransactions();
      rematchingController.flushTransactionBuffer();
      projectionState = calculateUpdate(projectionState, transactions);
    } else if (transaction.docChanged) {
      logger.debug("Shifting decorations");
      projectionState.decorations = shiftDecorations(projectionState.decorations, transaction);
      projectionState = Object.assign({}, projectionState);
    }
    return projectionState;
  },

  provide(field: StateField<ProjectionState>) {
    return EditorView.decorations.from(field, (state) => state.decorations);
  },
});

function shiftDecorations(decorations: DecorationSet, transaction: Transaction) {
  const delta = transaction.changes.newLength - transaction.changes.length;
  let last = 0;
  transaction.changes.iterChangedRanges((_, toA, __, ___) => {
    last = Math.max(last, toA);
  });
  decorations.between(last + 1, transaction.changes.length, (from, _, dec) => {
    if (from > last) {
      dec.spec.widget.shift(delta);
    }
  });
  return decorations.map(transaction.changes);
}

function calculateUpdate(
  projectionState: ProjectionState,
  transactions: Transaction[],
  forceRematch = false,
  forceRecreation = false
) {
  const { config, decorations, rematchingController } = projectionState;
  if (!transactions.length && !forceRematch) {
    return projectionState;
  }

  let docChanged = false;
  let isCompletion = false;
  for (const transaction of transactions) {
    docChanged = docChanged || transaction.docChanged;
    isCompletion = isCompletion || Boolean(transaction.annotation(pickedCompletion));
  }

  // Find units to rematch and to invalidate
  const { unitsToRematch, unitsToInvalidate } = analyzeTransactions(
    transactions,
    docChanged,
    config.parser,
    forceRematch
  );

  // Rematch units and collect matches
  const newState = transactions[transactions.length - 1].state;
  let allMatches: Match[] = [];
  let allContextVariableRanges: ContextVariableRange[] = [];
  for (const unitToRematch of unitsToRematch) {
    const cursor = unitToRematch.walk();
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

  // Build new decorations
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

  // When a decoration is scolled outside the visible area, codemirror destroys the HTML
  // Therefore we redraw them
  if (forceRecreation) {
    newDecorations = redrawDecorations(
      0,
      newState.doc.length - 1,
      newDecorations,
      config.projectionRegistry,
      newState
    );
  }

  return {
    config,
    decorations: newDecorations,
    contextVariableRanges: allContextVariableRanges,
    rematchingController,
  };
}

/**
 * Redraws the decorations between the positions recreateFrom and recreateTo
 * @param recreateFrom
 * @param recreateTo
 * @param decorations
 * @param projectionRegistry
 * @param state
 */
function redrawDecorations(
  recreateFrom: number,
  recreateTo: number,
  decorations: DecorationSet,
  projectionRegistry: ProjectionRegistry,
  state: EditorState
): DecorationSet {
  const newDecorations = new RangeSetBuilder<Decoration>();
  decorations.between(recreateFrom, recreateTo, (from, to, dec) => {
    const oldWidget = dec.spec.widget;

    // Save old state
    const range = { from, to };
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
    decorations = decorations.update({
      filter: (_, __, currentDecoration) => currentDecoration !== dec,
    });
  });
  const newDecorationSet = newDecorations.finish();
  return RangeSet.join([newDecorationSet, decorations]);
}

/**
 * @const
 * UpdateListener detecting changes in the viewport cuased by scrolling and then
 * causes all decorations to be redrawn.
 */
export const scrollListener = EditorView.updateListener.of((update: ViewUpdate) => {
  if (update.viewportChanged && !update.transactions.length) {
    update.view.dispatch({
      effects: forceRecreateDecorationsEffect.of(true),
    });
  }
});
