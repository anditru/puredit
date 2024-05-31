import * as vscode from "vscode";
import { getNonce, lineAt } from "./utils";
import {
  ChangeDocumentPayload,
  ChangeEditorPayload,
  ChangeType,
  Message,
  MessageType,
} from "@puredit/editor-interface";
import { Action } from "@puredit/editor-interface";
import { v4 as uuid } from "uuid";
import { Diagnostic, LanguageService, TextDocument } from "vscode-json-languageservice";
import * as fs from "fs";

export interface SvelteResources {
  scriptPath: string;
  stylePath: string;
}

export class ProjectionalEditorProvider implements vscode.CustomTextEditorProvider {
  public static register(
    context: vscode.ExtensionContext,
    viewType: string,
    svelteResources: SvelteResources,
    extensionLanguageService: LanguageService
  ): vscode.Disposable {
    const provider = new this(context, svelteResources, extensionLanguageService);
    const providerRegistration = vscode.window.registerCustomEditorProvider(viewType, provider);
    return providerRegistration;
  }

  private pendingDuplicateUpdates = 0;
  private documentStates: Map<string, string> = new Map();

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly svelteResources: SvelteResources,
    private readonly extensionLanguageService: LanguageService
  ) {
    // Store the initial state of all open documents
    vscode.workspace.textDocuments.forEach((doc) => {
      this.documentStates.set(doc.uri.toString(), doc.getText());
    });

    // Listen to document open events to track newly opened documents
    context.subscriptions.push(
      vscode.workspace.onDidOpenTextDocument((doc) => {
        this.documentStates.set(doc.uri.toString(), doc.getText());
      })
    );

    // Listen to document close events to clean up
    context.subscriptions.push(
      vscode.workspace.onDidCloseTextDocument((doc) => {
        this.documentStates.delete(doc.uri.toString());
      })
    );
  }

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true,
    };
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

    vscode.workspace.onDidChangeConfiguration(async (e) => {
      if (e.affectsConfiguration("puredit.extensionDescriptors")) {
        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);
      }
    });

    webviewPanel.webview.onDidReceiveMessage(async (message: Message) => {
      if (message.action === Action.GET_DOCUMENT) {
        webviewPanel.webview.postMessage({
          id: message.id,
          type: MessageType.RESPONSE,
          action: Action.GET_DOCUMENT,
          payload: document.getText(),
        });
      } else if (message.action === Action.UPDATE_DOCUMENT) {
        const workspaceEdit = this.mapToWorkspaceEdit(
          message.payload! as ChangeDocumentPayload,
          document
        );
        this.pendingDuplicateUpdates += 1;
        await vscode.workspace.applyEdit(workspaceEdit);
        webviewPanel.webview.postMessage({
          id: message.id,
          type: MessageType.RESPONSE,
          action: Action.UPDATE_DOCUMENT,
        });
      } else if (message.action === Action.GET_PROJECTION_EXTENSIONS) {
        const config = vscode.workspace.getConfiguration("puredit");
        const descriptorPaths = config.get("extensionDescriptors") as string[];
        const extensions = await this.readProjectionExtensions(descriptorPaths);
        webviewPanel.webview.postMessage({
          id: message.id,
          type: MessageType.RESPONSE,
          action: Action.GET_PROJECTION_EXTENSIONS,
          payload: JSON.stringify(extensions),
        });
      }
    });

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.contentChanges.length === 0) {
        return;
      }
      const documentUri = e.document.uri.toString();
      const oldDocument = this.documentStates.get(documentUri);

      if (e.document.uri.toString() === document.uri.toString()) {
        if (this.pendingDuplicateUpdates === 0) {
          e.contentChanges.forEach((contentChange) => {
            webviewPanel.webview.postMessage({
              id: uuid(),
              type: MessageType.REQUEST,
              action: Action.UPDATE_EDITOR,
              payload: this.mapToChangeSpec(contentChange, oldDocument!),
            });
          });
        } else {
          this.pendingDuplicateUpdates -= 1;
        }
      }

      this.documentStates.set(documentUri, e.document.getText());
    });

    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });
  }

  private async readProjectionExtensions(descriptorPaths: string[]) {
    let extensions: any[] = [];
    for (const descriptorPath of descriptorPaths) {
      let descriptor: string;
      try {
        descriptor = fs.readFileSync(descriptorPath, "utf-8");
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to read extension descriptor path ${descriptorPath}.`
        );
        continue;
      }

      const textDocument = TextDocument.create("config.json", "json", 1, descriptor);
      const jsonDocument = this.extensionLanguageService.parseJSONDocument(textDocument);
      const diagnostics = await this.extensionLanguageService.doValidation(
        textDocument,
        jsonDocument
      );
      const errors = diagnostics.filter(
        (diagnostic) => diagnostic.severity && diagnostic.severity <= 2
      );
      if (errors.length > 0) {
        const message = errors.reduce((prev, error: Diagnostic) => {
          const newMessage =
            (prev += `\nLine ${error.range.start.line}:${error.range.start.character} ${error.message}`);
          return newMessage;
        }, "Invalid configuration for Puredit extensions:");
        vscode.window.showErrorMessage(message);
      } else {
        extensions = extensions.concat(JSON.parse(descriptor));
      }
    }
    return extensions;
  }

  private mapToChangeSpec(
    contentChange: vscode.TextDocumentContentChangeEvent,
    document: string
  ): ChangeEditorPayload {
    let fromChar = contentChange.rangeOffset;
    let toChar = fromChar + contentChange.rangeLength;
    let insert = contentChange.text;

    if (process.platform === "win32") {
      fromChar = fromChar - lineAt(document, "\r\n", fromChar);
      toChar = toChar - lineAt(document, "\r\n", toChar);
      insert = insert.replace(/\r\n/g, "\n");
    }

    return {
      from: fromChar,
      to: toChar,
      insert,
    };
  }

  private mapToWorkspaceEdit(
    changePayload: ChangeDocumentPayload,
    document: vscode.TextDocument
  ): vscode.WorkspaceEdit {
    const workspaceEdit = new vscode.WorkspaceEdit();
    if (changePayload.type === ChangeType.INSERTION) {
      const position = document.positionAt(changePayload.from);
      workspaceEdit.insert(document.uri, position, changePayload.insert);
    } else if (changePayload.type === ChangeType.REPLACEMENT) {
      const range = this.buildRange(changePayload, document);
      workspaceEdit.replace(document.uri, range, changePayload.insert);
    } else if (changePayload.type === ChangeType.DELETION) {
      const range = this.buildRange(changePayload, document);
      workspaceEdit.delete(document.uri, range);
    }
    return workspaceEdit;
  }

  private buildRange(
    changePayload: ChangeDocumentPayload,
    document: vscode.TextDocument
  ): vscode.Range {
    const positionFrom = document.positionAt(changePayload.from);
    const positionTo = document.positionAt(changePayload.to);
    return new vscode.Range(positionFrom, positionTo);
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "out", this.svelteResources.scriptPath)
    );

    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "out", this.svelteResources.stylePath)
    );

    const baseDir = vscode.Uri.joinPath(this.context.extensionUri, "out/").toString().slice(7);
    const baseUrl = `https://${scriptUri.authority}${baseDir}`;

    const nonce = getNonce();

    return /* html */ `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; connect-src ${webview.cspSource}; img-src ${webview.cspSource}; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'unsafe-eval' 'nonce-${nonce}' ${webview.cspSource};">
				<base href=${baseUrl}>
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleUri}" rel="stylesheet" />
			</head>

			<body>
				<script nonce="${nonce}">
					const vscode = acquireVsCodeApi();
				</script>
				<script nonce="${nonce}" type="module" src="${scriptUri}"></script>
				<div id="app"></div>
			</body>
			</html>`;
  }
}
