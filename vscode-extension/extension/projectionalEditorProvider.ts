import * as vscode from "vscode";
import { getNonce } from "./utils";
import {
  ChangeDocumentPayload,
  ChangeEditorPayload,
  ChangeType,
  Message,
  MessageType,
} from "@puredit/editor-interface";
import { Action } from "@puredit/editor-interface";
import { v4 as uuid } from "uuid";

export interface SvelteResources {
  scriptPath: string;
  stylePath: string;
}

export class ProjectionalEditorProvider implements vscode.CustomTextEditorProvider {
  public static register(
    context: vscode.ExtensionContext,
    viewType: string,
    svelteResources: SvelteResources
  ): vscode.Disposable {
    const provider = new this(context, svelteResources);
    const providerRegistration = vscode.window.registerCustomEditorProvider(viewType, provider);
    return providerRegistration;
  }

  private pendingDuplicateUpdates = 0;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly svelteResources: SvelteResources
  ) {}

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true,
    };
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

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
      }
    });

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.contentChanges.length === 0) {
        return;
      }
      if (e.document.uri.toString() === document.uri.toString()) {
        if (this.pendingDuplicateUpdates === 0) {
          e.contentChanges.forEach((contentChange) => {
            webviewPanel.webview.postMessage({
              id: uuid(),
              type: MessageType.REQUEST,
              action: Action.UPDATE_EDITOR,
              payload: this.mapToChangeSpec(contentChange),
            });
          });
        } else {
          this.pendingDuplicateUpdates -= 1;
        }
      }
    });

    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });
  }

  private mapToChangeSpec(
    contentChange: vscode.TextDocumentContentChangeEvent
  ): ChangeEditorPayload {
    const fromChar = contentChange.rangeOffset;
    const toChar = fromChar + contentChange.rangeLength;

    return {
      from: fromChar,
      to: toChar,
      insert: contentChange.text,
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
