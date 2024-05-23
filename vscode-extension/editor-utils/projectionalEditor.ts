import { EditorView } from "codemirror";
import { Annotation, ChangeSpec, EditorState, Extension, Transaction } from "@codemirror/state";
import { Action, mapTransactionToChanges } from "@puredit/editor-interface";
import VsCodeMessenger from "./vsCodeMessenger";

export default class ProjectionalEditor {
  private readonly doNotSyncAnnotation = Annotation.define<boolean>();
  private readonly editorView: EditorView;

  constructor(
    private readonly vsCodeMessenger: VsCodeMessenger,
    extensions: Extension[],
    parent: Element | DocumentFragment
  ) {
    this.vsCodeMessenger.registerHandler(Action.UPDATE_EDITOR, (message) => {
      const payload = message.payload as { from: number; to: number; insert: string | Text };
      let cursorPosition;
      if (payload.insert.length) {
        const documentLength = this.editorView.state.doc.length + payload.insert.length;
        cursorPosition = Math.min(payload.to + payload.insert.length, documentLength - 1);
      } else {
        cursorPosition = payload.from;
      }
      const changes = message.payload as ChangeSpec;
      this.editorView.dispatch({
        changes,
        selection: {
          anchor: cursorPosition,
          head: cursorPosition,
        },
        annotations: this.doNotSyncAnnotation.of(true),
        filter: false,
      });
    });
    this.editorView = new EditorView({
      state: EditorState.create({ extensions }),
      parent,
      dispatch: this.dispatchTransction.bind(this),
    });
  }

  dispatchTransction(transaction: Transaction, projectionalEditor: EditorView) {
    if (!transaction.changes.empty && !transaction.annotation(this.doNotSyncAnnotation)) {
      const changes = mapTransactionToChanges(transaction);
      changes.forEach((change) => {
        this.vsCodeMessenger.sendRequest(Action.UPDATE_DOCUMENT, change.toChangeDocumentPayload());
      });
      projectionalEditor.update([transaction]);
    } else {
      projectionalEditor.update([transaction]);
    }
  }

  async initialize(): Promise<void> {
    const response = await this.vsCodeMessenger.sendRequest(Action.GET_DOCUMENT);
    const text = response.payload as string;
    this.editorView.dispatch({
      changes: { from: 0, insert: text },
      annotations: this.doNotSyncAnnotation.of(true),
      filter: false,
    });
  }

  destroy() {
    this.editorView.destroy();
  }
}
