import type { EditorView } from "@codemirror/view";
import type { EditorState } from "@codemirror/state";
import type { Match } from "@puredit/parser";
import { ProjectionWidget } from "../widget/widget";
import { ContextInformation } from "../types";

/**
 * Creates a static widget, i.e. a widget consisting only of static text
 * without editable text fields.
 * @param initialize
 * @returns
 */
export const staticWidget = (initialize: (state: EditorState) => HTMLElement) =>
  class extends ProjectionWidget {
    protected initialize(
      _match: Match,
      _context: ContextInformation,
      state: EditorState
    ): HTMLElement {
      return initialize(state);
    }

    protected update(): void {
      return;
    }

    toDOM(view: EditorView): HTMLElement {
      const dom = super.toDOM(view);
      dom.addEventListener("click", () => {
        view.dispatch({
          selection: {
            anchor: this.match.node.startIndex,
            head: this.match.node.endIndex,
          },
        });
      });
      return dom;
    }
  };
