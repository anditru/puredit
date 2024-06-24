import * as vscode from "vscode";
import { extensionLanguageService } from "./extensionLanguageService";
import { ProjectionalEditorProvider } from "./projectionalEditorProvider";
import { SvelteResources } from "./editorRegistry";
import DocumentRegistry from "./documentRegistry";

export async function activate(extensionContext: vscode.ExtensionContext) {
  DocumentRegistry.init(extensionContext);

  // Scan for declarative projection descriptors if required
  const config = vscode.workspace.getConfiguration("puredit");
  const scanForDescriptors =
    config.get<string[]>("scanForDeclarativeProjectionDescriptors") || false;
  if (scanForDescriptors) {
    scanForDeclarativeProjectionDescriptors(config);
  }

  // Register ProjectionalEditorProvider
  const svelteResources: SvelteResources = {
    scriptPath: "editors/python/index.js",
    stylePath: "editors/python/index.css",
  };
  const projectionalPythonEditorProvider = new ProjectionalEditorProvider(
    extensionContext,
    svelteResources,
    extensionLanguageService()
  );
  const providerRegistration = vscode.window.registerCustomEditorProvider(
    "puredit.PythonEditor",
    projectionalPythonEditorProvider
  );
  extensionContext.subscriptions.push(providerRegistration);

  // Register reloadProjectionalEditors command
  extensionContext.subscriptions.push(
    vscode.commands.registerCommand("puredit.reloadProjectionalEditors", () => {
      projectionalPythonEditorProvider.reloadAllEditors();
    })
  );
}

async function scanForDeclarativeProjectionDescriptors(
  extensionConfig: vscode.WorkspaceConfiguration
) {
  const descriptorFiles = await vscode.workspace.findFiles("**/*.ext.json");
  const existingDescriptorPaths =
    extensionConfig.get<string[]>("declarativeProjectionDescriptors") || [];
  const pathSet = new Set(existingDescriptorPaths);
  descriptorFiles.map((path) => path.fsPath).forEach((path) => pathSet.add(path));
  const newDescriptorPaths = [...pathSet];
  extensionConfig.update("declarativeProjectionDescriptors", newDescriptorPaths);
}
