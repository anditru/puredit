import { EditorSelection, EditorState } from "@codemirror/state";
import { EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { projectionState } from "./state/state";

export const cursorRescuer = ViewPlugin.fromClass(
  class {
    view: EditorView;

    constructor(view: EditorView) {
      this.view = view;
    }

    update(update: ViewUpdate) {
      const newState: EditorState = update.state;
      const newSelection = newState.selection.main;
      const oldState: EditorState = update.startState;
      const oldSelection = oldState.selection.main;
      if (!newSelection || newSelection.from !== newSelection.to) {
        return;
      }
      let trapped = false;
      let newPos: number | null = null;
      const decorations = newState.field(projectionState).decorations;
      decorations.between(newSelection.from + 1, newSelection.to - 1, (from, to, _) => {
        trapped = true;
        if (newSelection.head < oldSelection.head) {
          newPos = from;
        } else {
          newPos = to;
        }
        return false;
      });
      if (trapped) {
        requestAnimationFrame(() => moveCursorToPosition(newPos!, this.view));
      }
    }
  }
);

function moveCursorToPosition(position: number, view: EditorView) {
  view.dispatch({
    selection: EditorSelection.single(position),
  });
}
