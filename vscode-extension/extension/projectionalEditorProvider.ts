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

const PROJECTIONAL_EDITOR_RUNNING_KEY = "projectionalEditorRunning";

export interface SvelteResources {
  scriptPath: string;
  stylePath: string;
}

export class ProjectionalEditorProvider implements vscode.CustomTextEditorProvider {
  private pendingDuplicateUpdates = 0;
  private documentStates: Map<string, string> = new Map();

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly svelteResources: SvelteResources,
    private readonly projectionalEditors: Record<string, vscode.WebviewPanel>,
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
    vscode.commands.executeCommand("setContext", PROJECTIONAL_EDITOR_RUNNING_KEY, true);
    this.projectionalEditors[document.uri.toString()] = webviewPanel;

    const changeConfigurationSubscription = vscode.workspace.onDidChangeConfiguration(async (e) => {
      if (
        e.affectsConfiguration("puredit.declarativeProjectionDescriptors") ||
        e.affectsConfiguration("puredit.enabledPackages")
      ) {
        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);
      }
    });

    const messageSubscription = webviewPanel.webview.onDidReceiveMessage(
      async (message: Message) => {
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
        } else if (message.action === Action.GET_DECLARATIVE_PROJECTIONS) {
          const config = vscode.workspace.getConfiguration("puredit");
          const descriptorPaths = config.get<string[]>("declarativeProjectionDescriptors") || [];
          const extensions = await this.readDeclarativeProjections(descriptorPaths);
          webviewPanel.webview.postMessage({
            id: message.id,
            type: MessageType.RESPONSE,
            action: Action.GET_DECLARATIVE_PROJECTIONS,
            payload: JSON.stringify(extensions),
          });
        } else if (message.action === Action.GET_DISABLED_PACKAGES) {
          const config = vscode.workspace.getConfiguration("puredit");
          const enabledPackages = config.get<Record<string, boolean>>("enabledPackages") || {};
          const disabledPackages = Object.keys(enabledPackages).filter(
            (key) => !enabledPackages[key]
          );
          webviewPanel.webview.postMessage({
            id: message.id,
            type: MessageType.RESPONSE,
            action: Action.GET_DISABLED_PACKAGES,
            payload: JSON.stringify(disabledPackages),
          });
        } else if (message.action === Action.REPORT_ERROR) {
          vscode.window.showErrorMessage(message.payload);
        }
      }
    );

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
      changeConfigurationSubscription.dispose();
      messageSubscription.dispose();
      changeDocumentSubscription.dispose();
      delete this.projectionalEditors[document.uri.toString()];
      if (!Object.keys(this.projectionalEditors).length) {
        vscode.commands.executeCommand("setContext", PROJECTIONAL_EDITOR_RUNNING_KEY, false);
      }
    });
  }

  private async readDeclarativeProjections(descriptorPaths: string[]) {
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

  public getHtmlForWebview(webview: vscode.Webview): string {
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
