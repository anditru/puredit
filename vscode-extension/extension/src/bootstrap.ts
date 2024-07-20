/**
 * @module
 * Provides utility functions to construct the initial HTML for a webview
 * containing a projectional editor.
 */

import * as vscode from "vscode";
import { EditorContext } from "./editorRegistry";

export function getHtmlForWebview(context: EditorContext): string {
  const webview = context.webviewPanel.webview;

  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(
      context.extensionContext.extensionUri,
      "./dist",
      context.svelteResources.scriptPath
    )
  );
  const styleUri = webview.asWebviewUri(
    vscode.Uri.joinPath(
      context.extensionContext.extensionUri,
      "./dist",
      context.svelteResources.stylePath
    )
  );
  const baseDir = vscode.Uri.joinPath(context.extensionContext.extensionUri, "./dist/")
    .toString()
    .slice(7);
  const baseUrl = `https://${scriptUri.authority}${baseDir}`;
  const nonce = getNonce();

  return `
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

function getNonce() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
