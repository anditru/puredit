import { ChangeSet, EditorSelection, EditorState, Line, Transaction } from "@codemirror/state";
import { ChangeSpec } from "@codemirror/state";
import { ProjectionWidget } from "./widget/widget";
import { projectionState } from "./state/state";
import { Match } from "@puredit/parser";

export const transactionFilter = EditorState.transactionFilter.of((tr) => {
  const userEvent = tr.annotation(Transaction.userEvent);

  if (userEvent === "move.line") {
    correctMoveLine(tr);
  } else if (userEvent === "input.copyline") {
    correctCopyLine(tr);
  } else if (userEvent === "delete.line") {
    correctDeleteLine(tr);
  } else {
    if (tr.docChanged) {
      correctOtherChanges(tr);
    } else {
      if (tr.selection?.ranges.length === 1 && tr.selection.main.empty) {
        correctCursorMovements(tr);
      } else if (tr.selection?.ranges.length && !tr.selection.main.empty) {
        correctSelectionRanges(tr);
      }
    }
  }

  return tr;
});

/**
 * When Alt + Up / Down is used to move a line, reject the transaction since this will end up in chaos
 * @param tr Transaction to correct
 */
function correctMoveLine(tr: Transaction) {
  const { decorations } = tr.startState.field(projectionState);
  const startDoc = tr.startState.doc;

  let reject = false;
  let moveDown: boolean | undefined;
  let movedLine: Line;
  let targetLine: Line;
  let i = 0;
  tr.changes.iterChanges((_, to, _fromB, _toB, insert) => {
    if (moveDown === undefined) {
      moveDown = insert.text.length === 2;
    }
    if (moveDown && i === 0) {
      movedLine = startDoc.lineAt(_fromB);
      targetLine = startDoc.lineAt(movedLine.to + 1);
    }
    if (moveDown === false && i === 0) {
      movedLine = startDoc.lineAt(to + 1);
      targetLine = startDoc.lineAt(movedLine.from - 1);
    }
    i++;
  });
  decorations.between(movedLine!.from, movedLine!.to, (_, __, ___) => {
    reject = true;
    return false;
  });
  decorations.between(targetLine!.from, targetLine!.to, (_, __, ___) => {
    reject = true;
    return false;
  });
  if (reject) {
    const cursorPosition = tr.startState.selection.main.anchor;
    Object.assign(tr, {
      changes: ChangeSet.of([], startDoc.length, tr.startState.lineBreak),
      selection: EditorSelection.single(cursorPosition, cursorPosition),
    });
  }
}

/**
 * When Alt + Shift + Up / Down is used to copy a line, the entire projection must be copied
 * @param tr Transaction to correct
 */
function correctCopyLine(tr: Transaction) {
  const { decorations } = tr.startState.field(projectionState);
  const startDoc = tr.startState.doc;

  let modifyCopy = false;
  const modifiedChanges: ChangeSpec[] = [];
  tr.changes.iterChanges((from, to, _fromB, _toB, insert) => {
    const change: ChangeSpec = { from, to: undefined, insert };
    let copiedLine: Line;
    let prefix = "";
    const postfix = "";
    if (insert.text[0] === "") {
      // Copy up
      copiedLine = startDoc.lineAt(from - 1);
      change.from = copiedLine.from - 1;
      prefix = "\n";
    } else {
      // Copy down
      copiedLine = startDoc.lineAt(to + 1);
      change.from = copiedLine.to;
      prefix = "\n";
    }
    let copyFrom = Infinity;
    let copyTo = 0;
    const leadingWhiteSpace = "";
    decorations.between(copiedLine.from, copiedLine.to, (_, __, dec) => {
      modifyCopy = true;
      const match = dec.spec.widget.match;
      if (match.from <= copiedLine.from || match.to >= copiedLine.to) {
        copyFrom = startDoc.lineAt(match.from).from;
        copyTo = startDoc.lineAt(match.to).to;
        change.from = startDoc.lineAt(match.to).to;
        return false;
      }
      if (match.from >= copiedLine.from && match.to <= copiedLine.to) {
        copyFrom = copiedLine.from;
        copyTo = copiedLine.to;
        return false;
      }
    });
    change.insert = prefix + leadingWhiteSpace + startDoc.slice(copyFrom, copyTo) + postfix;
    modifiedChanges.push(change);
  });
  if (modifyCopy) {
    const firstChange = modifiedChanges[0] as { from: number; to: number };
    const cursorPosition = firstChange.from + 1;
    Object.assign(tr, {
      selection: EditorSelection.single(cursorPosition, cursorPosition),
      changes: ChangeSet.of(modifiedChanges, startDoc.length, tr.startState.lineBreak),
    });
  }
}

/**
 * When Ctrl + Shift + K is used to delte a line, all lines spanned hy the projections must be deleted
 * @param tr Transaction to correct
 */
function correctDeleteLine(tr: Transaction) {
  const { decorations } = tr.startState.field(projectionState);
  const startDoc = tr.startState.doc;

  let modifyDelete = false;
  const modifiedChanges: ChangeSpec[] = [];
  let match: Match;
  let cursorPosition = 0;
  tr.changes.iterChanges((from, to, _fromB, _toB, insert) => {
    const change: ChangeSpec = { from, to, insert };
    const selection = tr.startState.selection.main;
    decorations.between(selection.from, selection.to, (_, __, dec) => {
      match = dec.spec.widget.match;
      change.from = startDoc.lineAt(match.from).from;
      cursorPosition = change.from;
      change.to = Math.min(startDoc.lineAt(match.node.endIndex).to + 1, startDoc.length);
      change.insert = "";
      modifyDelete = true;
      return false;
    });
    modifiedChanges.push(change);
  });
  if (modifyDelete) {
    Object.assign(tr, {
      selection: EditorSelection.single(cursorPosition, cursorPosition),
      changes: ChangeSet.of(modifiedChanges, startDoc.length, tr.startState.lineBreak),
    });
  }
}

/**
 * Ensure projections are selected either entirely or not at all
 * @param tr Transaction to correct
 */
function correctSelectionRanges(tr: Transaction) {
  const { selection } = tr;
  const { decorations } = tr.startState.field(projectionState);

  const anchor = selection!.main.anchor;
  const head = selection!.main.head;

  let left: number;
  let right: number;
  let direction: number;
  if (head <= anchor) {
    left = head;
    right = anchor;
    direction = -1;
  } else {
    left = anchor;
    right = head;
    direction = 1;
  }
  let newRange = selection!.main;

  decorations.between(left + 1, right - 1, (from, to, dec) => {
    const widget: ProjectionWidget = dec.spec.widget;
    left = Math.min(widget.match.from, from, left);
    right = Math.max(widget.match.to, to, right);
    if (direction === -1) {
      newRange = EditorSelection.range(right, left);
    } else {
      newRange = EditorSelection.range(left, right);
    }
  });

  Object.assign(tr, { selection: EditorSelection.create([newRange]) });
}

/**
 * Handle cursor movements into projections
 * @param tr Transaction to correct
 */
function correctCursorMovements(tr: Transaction) {
  const { selection } = tr;
  const { decorations } = tr.startState.field(projectionState);

  const pos = selection!.main.anchor;
  const assoc = selection!.main.assoc;
  // Find decorations that _contain_ the cursor (hence the +/- 1),
  // not only touch it
  decorations.between(pos, pos, (fromDec, toDec, dec) => {
    const widget = dec.spec.widget;
    if (!(widget instanceof ProjectionWidget)) {
      return;
    }
    // Cursor entering from left
    if (assoc === -1 && pos === fromDec + 1) {
      if (!widget.enterFromStart()) {
        Object.assign(tr, { selection: EditorSelection.single(toDec) });
      }
      return false;
    }
    // Cursor entering from right
    if (assoc === 1 && pos === toDec - 1) {
      if (!widget.enterFromEnd()) {
        Object.assign(tr, { selection: EditorSelection.single(fromDec) });
      }
      return false;
    }
  });
}

/**
 * Handle changes to a projection's range.
 * Changes that replace the whole projection are accepted.
 * Changes that remove the start or end of a decoration remove the whole projection range.
 * All other changes in the projection range are rejected.
 * @param tr Transaction to correct
 */
function correctOtherChanges(tr: Transaction) {
  const { decorations } = tr.startState.field(projectionState);

  const changes: ChangeSpec[] = [];
  let modifyChanges = false;
  tr.changes.iterChanges((from, to, _fromB, _toB, insert) => {
    const change = { from, to, insert };
    let accept = true;

    // Only check decorations for which the change affects
    // its insides. By using the +/- 1 offset, we avoid
    // filtering insertion directly before or after a decoration.
    decorations.between(from + 1, to - 1, (fromDec, toDec, dec) => {
      const widget: ProjectionWidget = dec.spec.widget;
      if ((from === fromDec && to === from + 1) || (to === toDec && from === to - 1)) {
        change.from = widget.match.from;
        change.to = widget.match.node.endIndex;
        Object.assign(tr, {
          selection: EditorSelection.single(widget.match.from),
        });
        modifyChanges = true;
        return false;
      }
      if (from > fromDec || to < toDec) {
        accept = false;
        modifyChanges = true;
        return false;
      }
    });

    // Correct transactions where text is inserted at the end of a line
    // right after a widget to prevent the cursor from jumping to the next line.
    const posNextToChange = from - 1;
    const cursorPosAtBegin = tr.startState.selection.main.anchor;
    decorations.between(posNextToChange, posNextToChange, (_, decTo, ___) => {
      const charNextToChange = tr.startState.doc.toString().charAt(posNextToChange);
      if (
        decTo === cursorPosAtBegin &&
        charNextToChange === "\n" &&
        change.insert.toString() !== ""
      ) {
        modifyChanges = true;
        change.from--;
        change.to--;
        Object.assign(tr, {
          selection: EditorSelection.single(change.to + 1),
        });
      }
    });

    if (accept) {
      changes.push(change);
    }
  }, true);

  if (modifyChanges) {
    Object.assign(tr, {
      changes: ChangeSet.of(changes, tr.changes.length, tr.startState.lineBreak),
    });
  }
}
