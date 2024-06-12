import * as vscode from "vscode";
import * as fs from "fs";
import { ProjectionalEditorProvider } from "./projectionalEditorProvider";
import { getLanguageService } from "vscode-json-languageservice";

const declarativeProjectionSchema = fs.readFileSync(
  __dirname + "/../src/declarativeProjectionSchema.json",
  "utf-8"
);
const extensionLanguageService = getLanguageService({
  schemaRequestService: (uri) => {
    if (uri === "file:///config.schema.json") {
      return Promise.resolve(JSON.stringify(declarativeProjectionSchema));
    }
    return Promise.reject(`Invalid uri ${uri}`);
  },
});
extensionLanguageService.configure({
  allowComments: false,
  schemas: [{ fileMatch: ["config.json"], uri: "config.schema.json" }],
});

const projectionalEditors: Record<string, vscode.WebviewPanel> = {};

export function activate(context: vscode.ExtensionContext) {
  const projectionalEditorProvider = new ProjectionalEditorProvider(
    context,
    {
      scriptPath: "editors/python/index.js",
      stylePath: "editors/python/index.css",
    },
    projectionalEditors,
    extensionLanguageService
  );
  const providerRegistration = vscode.window.registerCustomEditorProvider(
    "puredit.PythonEditor",
    projectionalEditorProvider
  );
  context.subscriptions.push(providerRegistration);

  context.subscriptions.push(
    vscode.commands.registerCommand("puredit.reloadProjectionalEditors", () => {
      Object.values(projectionalEditors).forEach((webviewPanel) => {
        webviewPanel.webview.html = projectionalEditorProvider.getHtmlForWebview(
          webviewPanel.webview
        );
      });
    })
  );
}
