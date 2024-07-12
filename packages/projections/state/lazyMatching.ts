import type { Parser } from "@puredit/parser";
import AstNode from "@puredit/parser/ast/node";
import AstCursor from "@puredit/parser/ast/cursor";
import { zip } from "@puredit/utils-shared";
import { loadNodeTypesToSplitFor } from "@puredit/language-config/load";
import { NodeTypesToSplitConfig } from "@puredit/language-config";
import { Transaction } from "@codemirror/state";

import { logProvider } from "../../../logconfig";
const logger = logProvider.getLogger("projections.state.lazyMatching");

export function analyzeTransaction(
  transaction: Transaction,
  parser: Parser,
  forceRematch: boolean
): TransactionResult {
  const oldState = transaction.startState;
  const oldText = oldState.sliceDoc(0);
  const { nonErrorUnits: oldNonErrorUnits } = getMatchingUnits(oldText, parser);

  const newState = transaction.state;
  const newText = newState.sliceDoc(0);
  const { nonErrorUnits: newNonErrorUnits, errorUnits: newErrorUnits } = getMatchingUnits(
    newText,
    parser
  );

  const newSelect = newState.selection.main;
  const oldSelect = oldState.selection.main;
  let unitsToRematch: AstNode[] = [];
  const unitsToInvalidate: AstNode[] = newErrorUnits;
  if (forceRematch) {
    // Force rematch -> rematch everything
    const { validUnits, invalidUnits } = filterInvalidUnits(newNonErrorUnits);
    unitsToRematch = validUnits;
    unitsToInvalidate.push(...invalidUnits);
    logger.debug("Force rematch. Rematching everything");
  } else if (transaction.docChanged) {
    // Document has changed -> find changed units and rematch them
    logger.debug("Document changed. Analyzing changes");
    const { changedUnits, errorUnits } = analyzeChanges(
      oldText,
      oldNonErrorUnits,
      newText,
      newNonErrorUnits
    );
    unitsToRematch = changedUnits;
    unitsToInvalidate.push(...errorUnits);
    logger.debug(
      `Rematching ${unitsToRematch.length} changed nodes, invalidating ${unitsToInvalidate.length} nodes`
    );
  } else if (newSelect.anchor === newSelect.head) {
    // Cursor is placed somewhere
    logger.debug("Searching node with cursor");
    const unitWithCursor = findUnitForPosition(newNonErrorUnits, newSelect.anchor);
    if (unitWithCursor) {
      // Cursor is in some unit
      const cursorNodeHasError = containsError(unitWithCursor);
      if (cursorNodeHasError) {
        // If unit has an error, just invalide but do not rematch
        unitsToInvalidate.push(unitWithCursor);
        logger.debug("Invalidating node with cursor");
      } else {
        // If unit has no error, rematch
        unitsToRematch = [unitWithCursor];
        logger.debug("Rematching node with cursor");
      }
    } else {
      // Cursor is outside any unit, e.g. in an empty line or invlid unit
      logger.debug("Rematching nothing");
    }
  } else if (newSelect.anchor !== newSelect.head) {
    // Parts of the code are selected
    let from: number | undefined | null;
    let to: number | undefined | null;
    if (oldSelect.head < newSelect.head) {
      from = oldSelect.head;
      to = newSelect.head;
    } else if (oldSelect.head > newSelect.head) {
      from = newSelect.head;
      to = oldSelect.head;
    }
    if (from == null || to == null) {
      unitsToRematch = newNonErrorUnits;
    } else {
      const unitsFrom = findNextLowerIndex(newNonErrorUnits, from) || 0;
      const unitsTo = findNextHigherIndex(newNonErrorUnits, to) || newNonErrorUnits.length - 1;
      const unitsInRange = newNonErrorUnits.slice(unitsFrom, unitsTo + 1);
      const { validUnits, invalidUnits } = filterInvalidUnits(unitsInRange);
      unitsToRematch = validUnits;
      unitsToInvalidate.push(...invalidUnits);
    }
  } else {
    // Fallback: Rematch everything
    const { validUnits, invalidUnits } = filterInvalidUnits(newNonErrorUnits);
    unitsToRematch = validUnits;
    unitsToInvalidate.push(...invalidUnits);
    logger.debug("Rematching everything");
  }
  return { unitsToRematch, unitsToInvalidate };
}

export interface TransactionResult {
  unitsToRematch: AstNode[];
  unitsToInvalidate: AstNode[];
}

function filterInvalidUnits(units: AstNode[]) {
  const invalidUnits: AstNode[] = [];
  const validUnits = units.filter((unit) => {
    if (containsError(unit)) {
      invalidUnits.push(unit);
      return false;
    } else {
      return true;
    }
  });
  return { validUnits, invalidUnits };
}

function getMatchingUnits(text: string, parser: Parser): SplitResult {
  const astCursor = new AstCursor(parser.parse(text).walk());
  const nodeTypesToSplit = loadNodeTypesToSplitFor(parser.language);
  return splitIntoMatchingUnits(astCursor, nodeTypesToSplit);
}

function splitIntoMatchingUnits(
  astCursor: AstCursor,
  nodeTypesToSplit: NodeTypesToSplitConfig
): SplitResult {
  if (astCursor.currentNode.type === "ERROR") {
    return {
      nonErrorUnits: [],
      errorUnits: [astCursor.currentNode],
    };
  }
  const result: SplitResult = {
    nonErrorUnits: [],
    errorUnits: [],
  };
  const fieldNameToSplit = nodeTypesToSplit[astCursor.currentNode.type];
  if (!fieldNameToSplit) {
    result.nonErrorUnits.push(astCursor.currentNode);
    return result;
  } else if (fieldNameToSplit === "*") {
    if (!astCursor.goToFirstChild()) {
      result.nonErrorUnits.push(astCursor.currentNode);
      return result;
    }
    do {
      const subResult = splitIntoMatchingUnits(astCursor, nodeTypesToSplit);
      result.nonErrorUnits.push(...subResult.nonErrorUnits);
      result.errorUnits.push(...subResult.errorUnits);
    } while (astCursor.goToNextSibling());
    astCursor.goToParent();
  } else {
    if (!astCursor.goToChildWithFieldName(fieldNameToSplit)) {
      result.nonErrorUnits.push(astCursor.currentNode);
      return result;
    }
    const subResult = splitIntoMatchingUnits(astCursor, nodeTypesToSplit);
    result.nonErrorUnits.push(...subResult.nonErrorUnits);
    result.errorUnits.push(...subResult.errorUnits);
    astCursor.goToParent();
  }
  return result;
}

interface SplitResult {
  nonErrorUnits: AstNode[];
  errorUnits: AstNode[];
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

function findNextLowerIndex(units: AstNode[], cursorPos: number): number | null {
  let low = 0;
  let high = units.length - 1;
  let lastBeforeCursor: number | null = null;

  while (high >= low) {
    const mid = Math.floor(low + (high - low) / 2);
    const currentNode = units[mid];

    if (cursorPos >= currentNode.startIndex && cursorPos <= currentNode.endIndex) {
      return mid;
    } else if (cursorPos < currentNode.startIndex) {
      high = mid - 1;
    } else {
      lastBeforeCursor = mid;
      low = mid + 1;
    }
  }

  return lastBeforeCursor;
}

function findNextHigherIndex(units: AstNode[], cursorPos: number): number | null {
  let low = 0;
  let high = units.length - 1;
  let nextAfterCursor: number | null = null;

  while (high >= low) {
    const mid = Math.floor(low + (high - low) / 2);
    const currentNode = units[mid];

    if (cursorPos >= currentNode.startIndex && cursorPos <= currentNode.endIndex) {
      return mid;
    } else if (cursorPos < currentNode.startIndex) {
      nextAfterCursor = mid;
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  return nextAfterCursor;
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
