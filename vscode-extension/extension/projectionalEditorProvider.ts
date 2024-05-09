import * as vscode from "vscode";
import { getNonce } from "./utils";
import {
  ChangeDocumentPayload,
  ChangeEditorPayload,
  ChangeType,
  Message,
} from "@puredit/editor-interface";
import { MessageType } from "@puredit/editor-interface";

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

  private updateCounter = 0;

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

    webviewPanel.webview.onDidReceiveMessage((message: Message) => {
      if (message.type === MessageType.GET_DOCUMENT) {
        webviewPanel.webview.postMessage({
          type: MessageType.SEND_DOCUMENT,
          payload: document.getText(),
        });
      } else if (message.type === MessageType.UPDATE_DOCUMENT) {
        const workspaceEdit = this.mapToWorkspaceEdit(
          message.payload! as ChangeDocumentPayload,
          document
        );
        vscode.workspace.applyEdit(workspaceEdit);
        this.updateCounter += 1;
      }
    });

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.contentChanges.length === 0) {
        return;
      }
      if (e.document.uri.toString() === document.uri.toString()) {
        if (this.updateCounter === 0) {
          e.contentChanges.forEach((contentChange) => {
            webviewPanel.webview.postMessage({
              type: MessageType.UPDATE_EDITOR,
              payload: this.mapToChangeSpec(contentChange),
            });
          });
        } else {
          this.updateCounter -= 1;
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
      const position = new vscode.Position(changePayload.lineFrom, changePayload.characterFrom);
      workspaceEdit.insert(document.uri, position, changePayload.inserted);
    } else if (changePayload.type === ChangeType.REPLACEMENT) {
      const range = this.buildRange(changePayload);
      workspaceEdit.replace(document.uri, range, changePayload.inserted);
    } else if (changePayload.type === ChangeType.DELETION) {
      const range = this.buildRange(changePayload);
      workspaceEdit.delete(document.uri, range);
    }
    return workspaceEdit;
  }

  private buildRange(changePayload: ChangeDocumentPayload): vscode.Range {
    const positionFrom = new vscode.Position(changePayload.lineFrom, changePayload.characterFrom);
    const positionTo = new vscode.Position(changePayload.lineTo, changePayload.characterTo);
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
