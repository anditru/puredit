import { EditorState, RangeSetBuilder, StateEffect, StateField } from "@codemirror/state";
import { Decoration, EditorView } from "@codemirror/view";
import type { DecorationSet, ViewUpdate } from "@codemirror/view";
import { PatternMatching } from "@puredit/parser";
import { pickedCompletion } from "@codemirror/autocomplete";
import type { ContextVariableRange, Match, Parser } from "@puredit/parser";
import type { ProjectionPluginConfig } from "../types";
import DecorationSetBuilder from "./decorationSetBuilder";
import AstNode from "@puredit/parser/ast/node";
import AstCursor from "@puredit/parser/ast/cursor";
import { zip } from "@puredit/utils-shared";
import { Extension } from "@puredit/declarative-projections";
import ProjectionRegistry from "../projectionRegistry";
import { loadNodeTypesToSplitFor } from "@puredit/language-config/load";
import { NodeTypesToSplitConfig } from "@puredit/language-config";

import { logProvider } from "../../../logconfig";
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

    decorations = decorations.map(transaction.changes);
    const oldState = transaction.startState;
    const oldText = oldState.sliceDoc(0);
    const oldUnits = getMatchingUnits(oldText, config.parser);

    const newState = transaction.state;
    const newText = newState.sliceDoc(0);
    const newUnits = getMatchingUnits(newText, config.parser);

    const mainSelect = newState.selection.main;
    let unitsToRematch: AstNode[] = [];
    let unitsToInvalidate: AstNode[] = [];
    if (forceRematch) {
      // Force rematch -> rematch everything
      unitsToRematch = newUnits;
      unitsToInvalidate = newUnits;
      logger.debug("Force rematch. Rematching everything");
    } else if (transaction.docChanged) {
      // Document has changed -> find changed units and rematch them
      logger.debug("Document changed. Analyzing changes");
      const { changedUnits, errorUnits } = analyzeChanges(oldText, oldUnits, newText, newUnits);
      unitsToRematch = changedUnits;
      unitsToInvalidate = errorUnits.concat(changedUnits);
      logger.debug(
        `Rematching ${unitsToRematch.length} changed nodes, invalidating ${unitsToInvalidate.length} nodes`
      );
    } else if (mainSelect && mainSelect.anchor === mainSelect.head) {
      // Cursor is placed somewhere
      logger.debug("Searching node with cursor");
      const unitWithCursor = findUnitForPosition(newUnits, mainSelect.anchor);
      if (unitWithCursor) {
        // Cursor is in some node
        const cursorNodeHasError = containsError(unitWithCursor);
        if (cursorNodeHasError) {
          // If node has an error, just invalide but do not rematch
          unitsToInvalidate = [unitWithCursor];
          logger.debug("Invalidating node with cursor");
        } else {
          // If node has no error, rematch
          unitsToRematch = [unitWithCursor];
          unitsToInvalidate = [unitWithCursor];
          logger.debug("Rematching node with cursor");
        }
      } else {
        // Cursor is outside a node, e.g. in an empty line
        logger.debug("Rematching nothing");
      }
    } else {
      // Fallback: Rematch everything
      unitsToRematch = newUnits;
      unitsToInvalidate = newUnits;
      logger.debug("Rematching everything");
    }

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

function getMatchingUnits(text: string, parser: Parser): AstNode[] {
  const astCursor = new AstCursor(parser.parse(text).walk());
  const nodeTypesToSplit = loadNodeTypesToSplitFor(parser.language);
  return splitIntoMatchingUnits(astCursor, nodeTypesToSplit);
}

function splitIntoMatchingUnits(
  astCursor: AstCursor,
  nodeTypesToSplit: NodeTypesToSplitConfig
): AstNode[] {
  let matchingUnits: AstNode[] = [];
  const fieldNameToSplit = nodeTypesToSplit[astCursor.currentNode.type];
  if (!fieldNameToSplit) {
    matchingUnits.push(astCursor.currentNode);
    return matchingUnits;
  } else if (fieldNameToSplit === "*") {
    astCursor.goToFirstChild();
    do {
      matchingUnits = matchingUnits.concat(splitIntoMatchingUnits(astCursor, nodeTypesToSplit));
    } while (astCursor.goToNextSibling());
    astCursor.goToParent();
  } else {
    astCursor.goToChildWithFieldName(fieldNameToSplit);
    matchingUnits = matchingUnits.concat(splitIntoMatchingUnits(astCursor, nodeTypesToSplit));
    astCursor.goToParent();
  }
  return matchingUnits;
}

function findUnitForPosition(units: AstNode[], cursorPos: number): AstNode | null {
  let low = 0;
  let high = units.length - 1;
  while (high >= low) {
    const mid = Math.floor(low + (high - low) / 2);
    const currentNode = units[mid];
    if (cursorPos >= currentNode.startIndex && cursorPos <= currentNode.endIndex) {
      return currentNode;
    } else if (cursorPos < currentNode.endIndex) {
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }
  return null;
}

function analyzeChanges(
  oldText: string,
  oldUnits: AstNode[],
  newText: string,
  newUnits: AstNode[]
) {
  if (!newUnits.length) {
    return { changedUnits: [], errorUnits: [] };
  }

  const changedUnits: AstNode[] = [];
  const errorUnits: AstNode[] = [];

  const oldLeadingWhiteSpace = oldText.match(/^\s*/);
  const newLeadingWhiteSpace = newText.match(/^\s*/);
  let i = 0;
  if (
    (oldLeadingWhiteSpace &&
      newLeadingWhiteSpace &&
      oldLeadingWhiteSpace[0] !== newLeadingWhiteSpace[0]) ||
    (oldLeadingWhiteSpace && !newLeadingWhiteSpace) ||
    (!oldLeadingWhiteSpace && newLeadingWhiteSpace)
  ) {
    changedUnits.push(newUnits[0]);
    i = 1;
  }
  for (; i < newUnits.length; i++) {
    const oldUnit = oldUnits[i];
    const newUnit = newUnits[i];
    if (!oldUnit) {
      changedUnits.push(newUnit);
      continue;
    }
    if (oldUnit.text === newUnit.text) {
      continue;
    }
    if (newUnit.type === "ERROR") {
      errorUnits.push(newUnit);
      continue;
    }
    if (newUnit.type === "comment") {
      changedUnits.push(newUnit, newUnits[i + 1]);
      i++;
    }
    try {
      if (!nodesEqual(oldUnit, newUnit)) {
        changedUnits.push(newUnit);
      }
    } catch (error) {
      if (error instanceof ErrorFound) {
        errorUnits.push(newUnit);
      } else {
        throw error;
      }
    }
  }
  return { changedUnits, errorUnits };
}

function nodesEqual(oldNode: AstNode, newNode: AstNode, differenceFound = false): boolean {
  if (newNode.type == "ERROR") {
    throw new ErrorFound();
  }
  if (oldNode.type !== newNode.type) {
    differenceFound = true;
  }
  if (oldNode.startIndex !== newNode.startIndex || oldNode.endIndex !== newNode.endIndex) {
    differenceFound = true;
  }
  if (oldNode.children?.length !== newNode.children?.length) {
    differenceFound = true;
  }
  if (oldNode.children.length === 0) {
    differenceFound = oldNode.text !== newNode.text || differenceFound;
  }
  for (const [oldChildNode, newChildNode] of zip(oldNode.children, newNode.children)) {
    differenceFound = !nodesEqual(oldChildNode, newChildNode, differenceFound) || differenceFound;
  }
  return !differenceFound;
}

class ErrorFound extends Error {
  constructor(message?: string) {
    super(message);
  }
}

function containsError(rootNode: AstNode): boolean {
  const queue: AstNode[] = [rootNode];

  while (queue.length > 0) {
    const currentNode = queue.shift();

    if (currentNode) {
      if (currentNode.type === "ERROR") {
        return true;
      }

      for (const childNode of currentNode.children) {
        queue.push(childNode);
      }
    }
  }

  return false;
}

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
