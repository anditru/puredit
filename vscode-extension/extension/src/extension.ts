import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { ProjectionalEditorProvider } from "./projectionalEditorProvider";
import { getLanguageService } from "vscode-json-languageservice";

console.log(__dirname);
const declarativeProjectionSchema = fs.readFileSync(
  __dirname + "/declarativeProjectionSchema.json",
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

export async function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration("puredit");
  const scanForDescriptors =
    config.get<string[]>("scanForDeclarativeProjectionDescriptors") || false;
  if (scanForDescriptors) {
    const descriptorFiles = await vscode.workspace.findFiles("**/*.ext.json");
    const existingDescriptorPaths = config.get<string[]>("declarativeProjectionDescriptors") || [];
    const pathSet = new Set(existingDescriptorPaths);
    descriptorFiles.map((path) => path.fsPath).forEach((path) => pathSet.add(path));
    const newDescriptorPaths = [...pathSet];
    config.update("declarativeProjectionDescriptors", newDescriptorPaths);
  }

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
