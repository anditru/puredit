import { EditorView } from "codemirror";
import { Annotation, ChangeSpec, EditorState, Extension, Transaction } from "@codemirror/state";
import { Action, mapTransactionToChanges } from "@puredit/editor-interface";
import VsCodeMessenger from "./vsCodeMessenger";
import { Extension as ProjectionPackageExtension } from "@puredit/declarative-projections";
import { updateProjectionsEffect } from "@puredit/projections";

export default class ProjectionalEditor {
  private readonly doNotSyncAnnotation = Annotation.define<boolean>();
  private readonly editorView: EditorView;

  constructor(
    private readonly vsCodeMessenger: VsCodeMessenger,
    extensions: Extension[],
    parent: Element | DocumentFragment,
    private readonly onWindows: boolean
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

    this.vsCodeMessenger.registerHandler(Action.UPDATE_PROJECTIONS, (message) => {
      const extensions = JSON.parse(message.payload) as ProjectionPackageExtension[];
      this.editorView.dispatch({
        effects: updateProjectionsEffect.of(extensions),
        annotations: this.doNotSyncAnnotation.of(true),
      });
    });

    this.editorView = new EditorView({
      state: EditorState.create({ extensions }),
      parent,
      dispatch: this.dispatchTransction.bind(this),
    });
  }

  async initialize(): Promise<void> {
    const documentResponse = await this.vsCodeMessenger.sendRequest(Action.GET_DOCUMENT);
    const text = documentResponse.payload as string;
    this.editorView.dispatch({
      changes: { from: 0, insert: text },
      annotations: this.doNotSyncAnnotation.of(true),
      filter: false,
    });

    const projectionsResponse = await this.vsCodeMessenger.sendRequest(
      Action.GET_PROJECTION_EXTENSIONS
    );
    const extensions = JSON.parse(projectionsResponse.payload) as ProjectionPackageExtension[];
    this.editorView.dispatch({
      effects: updateProjectionsEffect.of(extensions),
      annotations: this.doNotSyncAnnotation.of(true),
    });
  }

  dispatchTransction(transaction: Transaction, projectionalEditor: EditorView) {
    if (!transaction.changes.empty && !transaction.annotation(this.doNotSyncAnnotation)) {
      const changes = mapTransactionToChanges(transaction, this.onWindows);
      changes.forEach((change) => {
        this.vsCodeMessenger.sendRequest(Action.UPDATE_DOCUMENT, change.toChangeDocumentPayload());
      });
      projectionalEditor.update([transaction]);
    } else {
      projectionalEditor.update([transaction]);
    }
  }

  destroy() {
    this.editorView.destroy();
  }
}
