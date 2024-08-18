/**
 * @module
 * Implements lazy matching to ensure we only rematch the areas of code
 * required to be remachted by the changes ade to the document and the
 * cursor movements.
 */

import type { Parser } from "@puredit/parser";
import AstNode from "@puredit/parser/ast/node";
import AstCursor from "@puredit/parser/ast/cursor";
import { loadNodeTypesToSplitFor } from "@puredit/language-config/load";
import { NodeTypesToSplitConfig } from "@puredit/language-config";
import { Transaction } from "@codemirror/state";

import { logProvider } from "../../../logconfig";
const logger = logProvider.getLogger("projections.state.lazyMatching");

/**
 * Analyzes the transactions in the buffer to determine the areas
 * to rematch and to invlaidate.
 * @param fristTransaction First transaction in the buffer
 * @param lastTransaction Last transaction in the buffer
 * @param docChanged
 * @param parser
 * @param forceRematch
 * @returns The units to rematch and invalidate
 */
export function analyzeTransactions(
  transactions: Transaction[],
  docChanged: boolean,
  parser: Parser,
  forceRematch: boolean
): TransactionResult {
  const firstTransaction = transactions[0];
  const lastTransaction = transactions[transactions.length - 1];

  const oldState = firstTransaction.startState;
  const oldText = oldState.sliceDoc(0);
  const { nonErrorUnits: oldNonErrorUnits } = getMatchingUnits(oldText, parser);

  const newState = lastTransaction.state;
  const newText = newState.sliceDoc(0);
  const { nonErrorUnits: newNonErrorUnits, errorUnits: newErrorUnits } = getMatchingUnits(
    newText,
    parser
  );

  const newSelect = newState.selection.main;
  const oldSelect = oldState.selection.main;
  let unitsToRematch: Set<AstNode> = new Set();
  const unitsToInvalidate: Set<AstNode> = new Set(newErrorUnits);
  if (forceRematch) {
    // Force rematch -> rematch everything
    const { validUnits, invalidUnits } = filterInvalidUnits(newNonErrorUnits);
    unitsToRematch = new Set(validUnits);
    insert(validUnits, unitsToInvalidate);
    insert(invalidUnits, unitsToInvalidate);
    logger.debug("Force rematch. Rematching everything");
  } else if (docChanged) {
    // Document has changed -> find changed units and rematch them
    logger.debug("Document changed. Analyzing changes");
    const { changedUnits, errorUnits } = analyzeChanges(
      oldText,
      oldNonErrorUnits,
      newText,
      newNonErrorUnits
    );
    unitsToRematch = changedUnits;
    insert([...errorUnits], unitsToInvalidate);

    const insertedUnits = getInsertedUnits(newNonErrorUnits, transactions);
    let insertedNonErrorUnits = difference(insertedUnits, errorUnits);
    insertedNonErrorUnits = difference(insertedNonErrorUnits, new Set(newErrorUnits));
    insert([...insertedNonErrorUnits], unitsToRematch);

    const unitWithCursor = findUnitForPosition(newNonErrorUnits, newSelect.head);
    if (unitWithCursor && !unitsToInvalidate.has(unitWithCursor)) {
      unitsToRematch.add(unitWithCursor);
    }
    insert([...unitsToRematch], unitsToInvalidate);
    logger.debug(
      `Rematching ${unitsToRematch.size} changed nodes, invalidating ${unitsToInvalidate.size} nodes`
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
        unitsToInvalidate.add(unitWithCursor);
        logger.debug("Invalidating node with cursor");
      } else {
        // If unit has no error, rematch
        unitsToRematch = new Set([unitWithCursor]);
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
      unitsToRematch = new Set(newNonErrorUnits);
    } else {
      const unitsFrom = findNextLowerIndex(newNonErrorUnits, from) || 0;
      const unitsTo = findNextHigherIndex(newNonErrorUnits, to) || newNonErrorUnits.length - 1;
      const unitsInRange = newNonErrorUnits.slice(unitsFrom, unitsTo + 1);
      const { validUnits, invalidUnits } = filterInvalidUnits(unitsInRange);
      unitsToRematch = new Set(validUnits);
      insert(invalidUnits, unitsToInvalidate);
    }
  } else {
    // Fallback: Rematch everything
    const { validUnits, invalidUnits } = filterInvalidUnits(newNonErrorUnits);
    unitsToRematch = new Set(validUnits);
    insert(invalidUnits, unitsToInvalidate);
    logger.debug("Rematching everything");
  }
  return {
    unitsToRematch: [...unitsToRematch].sort(nodeSorter),
    unitsToInvalidate: [...unitsToInvalidate].sort(nodeSorter),
  };
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

/**
 * Splits the syntax tree up into matching units based on the configuation
 * for the respective language in @puredit/language-config
 * @param text
 * @param parser
 */
export function getMatchingUnits(text: string, parser: Parser): SplitResult {
  const astCursor = new AstCursor(parser.parse(text).walk());
  const nodeTypesToSplit = loadNodeTypesToSplitFor(parser.language);
  return splitIntoMatchingUnits(astCursor, nodeTypesToSplit);
}

function splitIntoMatchingUnits(
  astCursor: AstCursor,
  nodeTypesToSplit: NodeTypesToSplitConfig
): SplitResult {
  if (isErrorNode(astCursor.currentNode)) {
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

/**
 * Finds all units that have been affected by the insertions caused by the given transactions
 * @param units
 * @param transactions
 */
function getInsertedUnits(units: AstNode[], transactions: Transaction[]) {
  const { from, to } = getAffectedTextRange(transactions);
  const firstUnitIndex = findNextHigherIndex(units, from) || 0;
  const lastUnitIndex = findNextLowerIndex(units, to) || units.length - 1;
  return new Set(units.slice(firstUnitIndex, lastUnitIndex + 1));
}

/**
 * Finds the first and last text position affected by the insertions caused by the given transactions
 * @param transactions
 */
function getAffectedTextRange(transactions: Transaction[]) {
  let startIndex = Infinity;
  let endIndex = 0;
  transactions.forEach((transaction) => {
    transaction.changes.iterChangedRanges((_, __, fromB, toB) => {
      startIndex = Math.min(startIndex, fromB);
      endIndex = Math.max(endIndex, toB);
    });
  });
  return {
    from: startIndex,
    to: endIndex,
  };
}

/**
 * Searches the unit, a position in the document belongs into.
 * @param units
 * @param pos
 * @returns The unit if the position belongs to one or null if the position
 * does not belong to any unit.
 */
function findUnitForPosition(units: AstNode[], pos: number): AstNode | null {
  let low = 0;
  let high = units.length - 1;
  while (high >= low) {
    const mid = Math.floor(low + (high - low) / 2);
    const currentNode = units[mid];
    if (pos >= currentNode.startIndex && pos <= currentNode.endIndex) {
      return currentNode;
    } else if (pos < currentNode.endIndex) {
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }
  return null;
}

/**
 * Finds the index of the unit, a certain position benlongs to
 * or the next unit before the position.
 * @param units
 * @param pos
 */
function findNextLowerIndex(units: AstNode[], pos: number): number | null {
  let low = 0;
  let high = units.length - 1;
  let lastBeforeCursor: number | null = null;

  while (high >= low) {
    const mid = Math.floor(low + (high - low) / 2);
    const currentNode = units[mid];

    if (pos >= currentNode.startIndex && pos <= currentNode.endIndex) {
      return mid;
    } else if (pos < currentNode.startIndex) {
      high = mid - 1;
    } else {
      lastBeforeCursor = mid;
      low = mid + 1;
    }
  }

  return lastBeforeCursor;
}

/**
 * Finds the index of the unit, a certain position benlongs to
 * or the next unit after the position.
 * @param units
 * @param pos
 */
function findNextHigherIndex(units: AstNode[], pos: number): number | null {
  let low = 0;
  let high = units.length - 1;
  let nextAfterCursor: number | null = null;

  while (high >= low) {
    const mid = Math.floor(low + (high - low) / 2);
    const currentNode = units[mid];

    if (pos >= currentNode.startIndex && pos <= currentNode.endIndex) {
      return mid;
    } else if (pos < currentNode.startIndex) {
      nextAfterCursor = mid;
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  return nextAfterCursor;
}

/**
 * Compares the units (i.e. nodes) before the changes by the buffered transactions
 * and after the buffered transactions to determine which units must be rematched and
 * which must be rematched.
 * @param oldText
 * @param oldUnits
 * @param newText
 * @param newUnits
 */
function analyzeChanges(
  oldText: string,
  oldUnits: AstNode[],
  newText: string,
  newUnits: AstNode[]
) {
  if (!newUnits.length) {
    return { changedUnits: new Set<AstNode>(), errorUnits: new Set<AstNode>() };
  }

  const changedUnits: Set<AstNode> = new Set();
  const errorUnits: Set<AstNode> = new Set();

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
    changedUnits.add(newUnits[0]);
    i = 1;
  }
  for (; i < newUnits.length; i++) {
    const oldUnit = oldUnits[i];
    const newUnit = newUnits[i];
    if (!oldUnit) {
      changedUnits.add(newUnit);
      continue;
    }
    if (oldUnit.text === newUnit.text) {
      continue;
    }
    if (isErrorNode(newUnit)) {
      errorUnits.add(newUnit);
      continue;
    }
    if (newUnit.type === "comment") {
      changedUnits.add(newUnit);
      changedUnits.add(newUnits[i + 1]);
      i++;
    }
    try {
      if (!nodesEqual(oldUnit, newUnit)) {
        changedUnits.add(newUnit);
      }
    } catch (error) {
      if (error instanceof ErrorFound) {
        errorUnits.add(newUnit);
      } else {
        throw error;
      }
    }
  }
  return { changedUnits, errorUnits };
}

/**
 * Performs a deep comparison of two nodes to determine if the two nodes are equal.
 * Performs a full traversal of the subtree below the newNode to make sure
 * no error nodes are hidden below it.
 * @param oldNode
 * @param newNode
 * @param differenceFound
 * @throws {ErrorFound}: If an error node is found below the new node.
 */
function nodesEqual(oldNode: AstNode, newNode: AstNode, differenceFound = false): boolean {
  if (isErrorNode(newNode)) {
    throw new ErrorFound();
  } else if (!newNode || !oldNode) {
    differenceFound = true;
  } else if (oldNode.children.length !== newNode.children.length) {
    differenceFound = true;
  } else if (newNode.children.length === 0) {
    differenceFound = oldNode?.text !== newNode?.text;
  } else {
    differenceFound = oldNode?.type !== newNode?.type;
  }

  const maxIndex = Math.max(oldNode?.children.length || 0, newNode?.children.length || 0);
  for (let i = 0; i < maxIndex; i++) {
    const oldChildNode = oldNode?.children[i];
    const newChildNode = newNode?.children[i];
    differenceFound = !nodesEqual(oldChildNode, newChildNode, differenceFound) || differenceFound;
  }

  return !differenceFound;
}

class ErrorFound extends Error {
  constructor(message?: string) {
    super(message);
  }
}

/**
 * Performs a BFS to check if a node contains an error.
 * @param rootNode
 */
export function containsError(rootNode: AstNode): boolean {
  const queue: AstNode[] = [rootNode];
  while (queue.length > 0) {
    const currentNode = queue.shift();
    if (currentNode) {
      if (isErrorNode(currentNode)) {
        return true;
      }
      for (const childNode of currentNode.children) {
        queue.push(childNode);
      }
    }
  }
  return false;
}

/**
 * Comparison function to be used with the arrays' sort function when sorting AstNodes
 * @param a
 * @param b
 */
function nodeSorter(a: AstNode, b: AstNode) {
  if (a.startIndex < b.startIndex) {
    return -1;
  } else if (a.startIndex > b.startIndex) {
    return 1;
  } else {
    if (a.endIndex < b.endIndex) {
      return -1;
    } else if (a.endIndex > b.endIndex) {
      return 1;
    } else {
      return 0;
    }
  }
}

/**
 * Computes the difference (a - b) of two sets.
 * @param a
 * @param b
 * @returns
 */
function difference(a: Set<any>, b: Set<any>) {
  const result = new Set();
  for (const elem of a) {
    if (!b.has(elem)) {
      result.add(elem);
    }
  }
  return result;
}

/**
 * Inserts an array of items into a tagret set.
 * @param items Items to insert
 * @param set Target set
 */
function insert(items: any[], set: Set<any>) {
  items.forEach((item) => set.add(item));
}

/**
 * Checks if the node represents an error. It not enough to simply check
 * if the node is of type ERROR since Tree-sitter does not consider a string
 * that is never closed an error in Python so this must be checked separately
 * @param node
 */
function isErrorNode(node?: AstNode) {
  if (node) {
    return (
      node.type === "ERROR" || (node.type === "string_end" && node.startIndex === node.endIndex)
    );
  } else {
    return undefined;
  }
}
