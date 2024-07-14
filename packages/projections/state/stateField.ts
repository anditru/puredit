import {
  EditorState,
  RangeSet,
  RangeSetBuilder,
  StateEffect,
  StateField,
  Transaction,
} from "@codemirror/state";
import { Decoration, EditorView } from "@codemirror/view";
import type { DecorationSet, ViewUpdate } from "@codemirror/view";
import { PatternMatching } from "@puredit/parser";
import { pickedCompletion } from "@codemirror/autocomplete";
import type { ContextVariableRange, Match } from "@puredit/parser";
import type { ProjectionPluginConfig } from "../types";
import DecorationSetBuilder from "./decorationSetBuilder";
import { Extension } from "@puredit/declarative-projections";
import ProjectionRegistry from "../projectionRegistry";
import { analyzeTransaction } from "./lazyMatching";
import { Debouncer } from "./debouncing";

import { logProvider } from "../../../logconfig";
const logger = logProvider.getLogger("projections.state.stateField");

export interface ProjectionState {
  config: ProjectionPluginConfig;
  decorations: DecorationSet;
  contextVariableRanges: ContextVariableRange[];
  rematchingController: Debouncer;
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

  const rematchingController = Debouncer.getInstance();

  return { config, decorations, contextVariableRanges, rematchingController };
}

export const insertDeclarativeProjectionsEffect = StateEffect.define<Extension[]>();
export const removeProjectionPackagesEffect = StateEffect.define<string[]>();
export const updateDelayEffect = StateEffect.define<number>();
export const forceRecreateDecorationsEffect = StateEffect.define<boolean>();
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
        config.projectionCompiler.compile(effect.value);
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
      projectionState.decorations = projectionState.decorations.map(transaction.changes);
      projectionState = Object.assign({}, projectionState);
    }
    return projectionState;
  },

  provide(field: StateField<ProjectionState>) {
    return EditorView.decorations.from(field, (state) => state.decorations);
  },
});

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

  const firstTransaction = transactions[0];
  const lastTransaction = transactions[transactions.length - 1];
  const { unitsToRematch, unitsToInvalidate } = analyzeTransaction(
    firstTransaction,
    lastTransaction,
    docChanged,
    config.parser,
    forceRematch
  );

  const newState = lastTransaction.state;
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

export const scrollListener = EditorView.updateListener.of((update: ViewUpdate) => {
  if (update.viewportChanged && !update.transactions.length) {
    update.view.dispatch({
      effects: forceRecreateDecorationsEffect.of(true),
    });
  }
});
