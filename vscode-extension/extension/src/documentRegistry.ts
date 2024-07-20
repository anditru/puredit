import * as vscode from "vscode";

/**
 * @class
 * Stores all documents opened in at least one projectional editor with
 * their current text end end-of-line character. This information is required
 * to correctly map the changes communicated form the projectional editors
 * to vscode.WorkspaceEdits.
 */
export default class DocumentRegistry {
  private static _instance: DocumentRegistry | undefined;

  static init(extensionContext: vscode.ExtensionContext) {
    if (!DocumentRegistry._instance) {
      DocumentRegistry._instance = new this();
    }

    vscode.workspace.textDocuments.forEach((document) =>
      DocumentRegistry.instance.update(document)
    );

    extensionContext.subscriptions.push(
      vscode.workspace.onDidOpenTextDocument((document) =>
        DocumentRegistry.instance.update(document)
      )
    );

    extensionContext.subscriptions.push(
      vscode.workspace.onDidCloseTextDocument((document) =>
        DocumentRegistry.instance.delete(document)
      )
    );
  }

  static get instance(): DocumentRegistry {
    if (!DocumentRegistry._instance) {
      throw new Error("Document registry is not initialized");
    }
    return DocumentRegistry._instance;
  }

  private readonly registry: Map<string, DocumentState>;

  private constructor() {
    this.registry = new Map();
  }

  update(document: vscode.TextDocument) {
    const documentState: DocumentState = {
      text: document.getText(),
      eol: document.eol,
    };
    this.registry.set(document.uri.toString(), documentState);
  }

  get(document: vscode.TextDocument) {
    return this.registry.get(document.uri.toString());
  }

  delete(document: vscode.TextDocument) {
    this.registry.delete(document.uri.toString());
  }
}

export interface DocumentState {
  text: string;
  eol: vscode.EndOfLine;
}
