import * as vscode from "vscode";

export class EditorRegistry {
  private readonly registry: Record<string, EditorContext> = {};

  register(editorContext: EditorContext) {
    const editorKey = getEditorKey(editorContext);
    this.registry[editorKey] = editorContext;
  }

  unregister(editorContext: EditorContext) {
    const editorKey = getEditorKey(editorContext);
    delete this.registry[editorKey];
  }

  getAllEditorContexts(): EditorContext[] {
    return Object.values(this.registry);
  }

  get numberOfEditors(): number {
    return Object.keys(this.registry).length;
  }
}

function getEditorKey(editorContext: EditorContext) {
  return editorContext.document.uri.toString();
}

export interface EditorContext {
  webviewPanel: vscode.WebviewPanel;
  document: vscode.TextDocument;
  extensionContext: vscode.ExtensionContext;
  svelteResources: SvelteResources;
}

export interface SvelteResources {
  scriptPath: string;
  stylePath: string;
}
