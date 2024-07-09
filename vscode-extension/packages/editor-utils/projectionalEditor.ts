import { EditorView } from "codemirror";
import {
  Annotation,
  ChangeSpec,
  EditorSelection,
  EditorState,
  Extension,
  Transaction,
} from "@codemirror/state";
import { Action } from "@puredit/webview-interface";
import { mapTransactionToChanges } from "./changeMapping";
import VsCodeMessenger from "./vsCodeMessenger";
import { Extension as ProjectionPackageExtension } from "@puredit/declarative-projections";
import {
  insertDeclarativeProjectionsEffect,
  removeProjectionPackagesEffect,
} from "@puredit/projections";

export default class ProjectionalEditor {
  private readonly doNotSyncAnnotation = Annotation.define<boolean>();
  private readonly editorView: EditorView;
  private eol: EndOfLine = EndOfLine.LF;

  constructor(
    private readonly vsCodeMessenger: VsCodeMessenger,
    extensions: Extension[],
    parent: Element | DocumentFragment
  ) {
    this.vsCodeMessenger.registerHandler(Action.UPDATE_EDITOR, (message) => {
      const payload = message.payload as { from: number; to: number; insert: string | Text };
      const lengthDelta = payload.insert.length - (payload.to - payload.from);
      let cursorPosition;
      if (payload.insert.length) {
        const newLength = this.editorView.state.doc.length + lengthDelta;
        cursorPosition = Math.min(payload.to + payload.insert.length, newLength - 1);
      } else {
        cursorPosition = payload.from;
      }
      const changes = message.payload as ChangeSpec;
      this.editorView.dispatch({
        changes,
        selection: EditorSelection.single(cursorPosition),
        annotations: this.doNotSyncAnnotation.of(true),
        filter: false,
      });
    });

    this.vsCodeMessenger.registerHandler(Action.UPDATE_EOL, (message) => {
      this.eol = message.payload as EndOfLine;
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

    const eolResponse = await this.vsCodeMessenger.sendRequest(Action.GET_EOL);
    this.eol = eolResponse.payload as EndOfLine;

    const disabledPackagesResponse = await this.vsCodeMessenger.sendRequest(
      Action.GET_DISABLED_PACKAGES
    );
    const disabledPackages = JSON.parse(disabledPackagesResponse.payload);
    this.editorView.dispatch({
      effects: removeProjectionPackagesEffect.of(disabledPackages),
      annotations: this.doNotSyncAnnotation.of(true),
    });

    const projectionsResponse = await this.vsCodeMessenger.sendRequest(
      Action.GET_DECLARATIVE_PROJECTIONS
    );
    const extensions = JSON.parse(projectionsResponse.payload) as ProjectionPackageExtension[];
    this.editorView.dispatch({
      effects: insertDeclarativeProjectionsEffect.of(extensions),
      annotations: this.doNotSyncAnnotation.of(true),
    });
  }

  dispatchTransction(transaction: Transaction, projectionalEditor: EditorView) {
    if (!transaction.changes.empty && !transaction.annotation(this.doNotSyncAnnotation)) {
      const changes = mapTransactionToChanges(transaction, this.eol);
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

export enum EndOfLine {
  LF = 1,
  CRLF = 2,
}
