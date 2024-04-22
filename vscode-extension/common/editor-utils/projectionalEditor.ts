import { EditorView } from "codemirror";
import { Annotation, ChangeSpec, EditorState, Extension, Transaction } from "@codemirror/state";
import { Message, MessageType, mapChangeSetToChanges } from "@puredit/editor-interface";

export default class ProjectionalEditor {
  readonly doNotSyncAnnotation = Annotation.define<boolean>();
  readonly editorView: EditorView;

  constructor(extensions: Extension[], parent: Element | DocumentFragment) {
    this.editorView = new EditorView({
      state: EditorState.create({ extensions }),
      parent,
      dispatch: this.dispatchTransction.bind(this),
    });
  }

  dispatchTransction(transaction: Transaction, projectionalEditor: EditorView) {
    if (!transaction.changes.empty && !transaction.annotation(this.doNotSyncAnnotation)) {
      const changes = mapChangeSetToChanges(transaction.changes);
      changes.forEach((change) => {
        const lineFromBefore = projectionalEditor.state.doc.lineAt(change.fromBefore);
        const lineToBefore = projectionalEditor.state.doc.lineAt(change.toBefore);
        change.setLinesBefore(lineFromBefore, lineToBefore);
      });

      projectionalEditor.update([transaction]);

      changes.forEach((change) => {
        const lineFromAfter = projectionalEditor.state.doc.lineAt(change.fromAfter);
        const lineToAfter = projectionalEditor.state.doc.lineAt(change.toAfter);
        change.setLinesAfter(lineFromAfter, lineToAfter);
        change.computeLineInfo();
        vscode.postMessage({
          type: MessageType.UPDATE_DOCUMENT,
          payload: change.toChangeDocumentPayload(),
        });
      });
    } else {
      projectionalEditor.update([transaction]);
    }
  }

  initialize(): void {
    vscode.postMessage({
      type: MessageType.GET_DOCUMENT,
    });
  }

  handleMessage(event) {
    const message: Message = event.data;
    if (message.type === MessageType.SEND_DOCUMENT) {
      const text = message.payload;
      this.editorView.dispatch({
        changes: { from: 0, insert: text as string },
        annotations: this.doNotSyncAnnotation.of(true),
        filter: false,
      });
    } else if (message.type === MessageType.UPDATE_EDITOR) {
      this.editorView.dispatch({
        changes: message.payload as ChangeSpec,
        annotations: this.doNotSyncAnnotation.of(true),
        filter: false,
      });
    }
  }

  destroy() {
    this.editorView.destroy();
  }
}
