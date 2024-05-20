import { ChangeSet, EditorSelection, EditorState, Transaction } from "@codemirror/state";
import { ChangeSpec, SelectionRange } from "@codemirror/state";
import { ProjectionWidget } from "./projection";
import { projectionState } from "./state/state";
import { Match } from "@puredit/parser";

export const transactionFilter = EditorState.transactionFilter.of((tr) => {
  const { decorations } = tr.startState.field(projectionState);
  const startDoc = tr.startState.doc;

  // When Ctrl + Shift + Up / Down is used to copy a line, the entire projection must be copied
  if (tr.annotation(Transaction.userEvent) === "input.copyline") {
    let modifyCopy = false;
    const modifiedChanges: ChangeSpec[] = [];
    tr.changes.iterChanges((from, to, _fromB, _toB, insert) => {
      const change: ChangeSpec = { from, to, insert };
      decorations.between(from, to, (_, __, dec) => {
        const match = dec.spec.widget.match;
        const insertBegin = startDoc.lineAt(match.node.startIndex).from;
        const insertEnd = match.node.endIndex;
        change.insert = "\n" + startDoc.slice(insertBegin, insertEnd);

        const matchEndLine = startDoc.lineAt(match.node.endIndex);
        change.from = matchEndLine.to;

        change.to = undefined;

        modifyCopy = true;
        return false;
      });
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

  // When Ctrl + Shift + K is used to delte a line, all lines spanned hy the projections must be deleted
  if (tr.annotation(Transaction.userEvent) === "delete.line") {
    let modifyDelete = false;
    const modifiedChanges: ChangeSpec[] = [];
    let match: Match;
    tr.changes.iterChanges((from, to, _fromB, _toB, insert) => {
      const change: ChangeSpec = { from, to, insert };
      const selection = tr.startState.selection.main;
      decorations.between(selection.from, selection.to, (_, __, dec) => {
        match = dec.spec.widget.match;
        change.from = startDoc.lineAt(match.from).from;
        change.to = Math.min(startDoc.lineAt(match.node.endIndex).to + 1, startDoc.length);
        change.insert = "";
        modifyDelete = true;
        return false;
      });
      modifiedChanges.push(change);
    });
    if (modifyDelete) {
      Object.assign(tr, {
        selection: EditorSelection.single(match!.from, match!.from),
        changes: ChangeSet.of(modifiedChanges, startDoc.length, tr.startState.lineBreak),
      });
    }
  }

  // Handle changes to a projection's range.
  // Changes that replace the whole projection are accepted.
  // Changes that remove the start or end of a decoration remove the whole projection range.
  // All other changes in the projection range are rejected.
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
    decorations.between(posNextToChange, posNextToChange, (_, decTo, ___) => {
      const charNextToChange = tr.startState.doc.toString().charAt(posNextToChange);
      if (
        decTo === posNextToChange &&
        charNextToChange === "\n" &&
        change.insert.toString() !== "" &&
        tr.annotation(Transaction.userEvent) !== "input.copyline" &&
        tr.annotation(Transaction.userEvent) !== "delete.line"
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

  // Handle cursor movements into projections
  const { selection } = tr;
  if (!modifyChanges && selection?.ranges.length === 1 && selection.main.empty) {
    const pos = selection.main.anchor;
    const assoc = selection.main.assoc;
    // Find decorations that _contain_ the cursor (hence the +/- 1),
    // not only touch it
    decorations.between(pos + 1, pos - 1, (fromDec, toDec, dec) => {
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

  // Ensure projections are selected either entirely or not at all
  if (!modifyChanges && selection?.ranges.length) {
    const newRanges: SelectionRange[] = [];
    for (const range of selection.ranges) {
      if (range.empty) {
        newRanges.push(range);
      } else {
        let newFrom: number;
        let newTo: number;
        let newRange = range;
        decorations.between(range.from, range.to, (from, to, dec) => {
          const widget: ProjectionWidget = dec.spec.widget;
          newFrom = Math.min(widget.match.from, from);
          newTo = Math.max(widget.match.to, to);
          newRange = EditorSelection.range(newFrom, newTo);
        });
        newRanges.push(newRange);
      }
    }
    Object.assign(tr, { selection: EditorSelection.create(newRanges) });
  }

  return tr;
});
