/**
 * @module
 * Main entry point of the extension.
 */

import * as vscode from "vscode";
import { ProjectionalEditorProvider } from "./projectionalEditorProvider";
import { SvelteResources } from "./editorRegistry";
import DocumentRegistry from "./documentRegistry";

/**
 * Initialized the extension and registers commands and the projectional editor
 * provider with VS Code.
 * @param extensionContext
 */
export async function activate(extensionContext: vscode.ExtensionContext) {
  DocumentRegistry.init(extensionContext);

  // Enable validation of yaml extension files
  const yamlConfig = vscode.workspace.getConfiguration("yaml");
  const pathToSchema = vscode.Uri.joinPath(
    extensionContext.extensionUri,
    "dist/declarativeProjectionSchema.json"
  ).toString();
  const currentSettings = yamlConfig.get<object>("schemas");
  const newSettings = { ...currentSettings, [pathToSchema]: "*.puredit.yaml" };
  yamlConfig.update("schemas", newSettings, vscode.ConfigurationTarget.Global);

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
    svelteResources
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
  const jsonDescriptorFiles = await vscode.workspace.findFiles("**/*.puredit.json");
  const yamlDescriptorFiles = await vscode.workspace.findFiles("**/*.puredit.yaml");
  const descriptorFiles = jsonDescriptorFiles.concat(yamlDescriptorFiles);
  const existingDescriptorPaths =
    extensionConfig.get<string[]>("declarativeProjectionDescriptors") || [];
  const pathSet = new Set(existingDescriptorPaths);
  descriptorFiles.map((path) => path.fsPath).forEach((path) => pathSet.add(path));
  const newDescriptorPaths = [...pathSet];
  extensionConfig.update("declarativeProjectionDescriptors", newDescriptorPaths);
}
