import * as vscode from "vscode";

export class EditorRegistry {
  private readonly registry: Map<vscode.WebviewPanel, EditorContext> = new Map();

  register(editorContext: EditorContext) {
    this.registry.set(editorContext.webviewPanel, editorContext);
  }

  unregister(editorContext: EditorContext) {
    this.registry.delete(editorContext.webviewPanel);
  }

  getAllEditorContexts(): EditorContext[] {
    return Array.from(this.registry.values());
  }

  get numberOfEditors(): number {
    return this.getAllEditorContexts().length;
  }
}

export interface EditorContext {
  webviewPanel: vscode.WebviewPanel;
  document: vscode.TextDocument;
  extensionContext: vscode.ExtensionContext;
  svelteResources: SvelteResources;
  pendingDuplicateUpdates: number;
}

export interface SvelteResources {
  scriptPath: string;
  stylePath: string;
}
