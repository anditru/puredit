import { EditorView } from "@codemirror/view";

/**
 * @const
 * Codemirror extension apply custom CSS classes
 * that ensure correct rendering of the projections
 */
export const style = EditorView.theme({
  ".cm-line.flex-center": {
    display: "flex",
    alignItems: "center",
  },
  ".cm-line.flex-top": {
    display: "flex",
    alignItems: "start",
  },
  ".inline-flex": {
    display: "inline-flex",
    alignItems: "center",
  },
  ".flex > *, .inline-flex > *": {
    flex: "0 0 auto",
  },
  ".cm-gutterElement": {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  ".cm-completionIcon": {
    boxSizing: "content-box",
  },
  ".cm-completionIcon-projection::after": {
    content: '"✨"',
  },
  ".space-left": {
    marginLeft: "8px",
  },
});
