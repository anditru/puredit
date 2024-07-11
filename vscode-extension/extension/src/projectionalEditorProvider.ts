import * as vscode from "vscode";
import { EventProcessor } from "./eventProcessor";
import { getHtmlForWebview } from "./bootstrap";
import { EditorContext, EditorRegistry, SvelteResources } from "./editorRegistry";

const PROJECTIONAL_EDITOR_RUNNING_KEY = "projectionalEditorRunning";

export class ProjectionalEditorProvider implements vscode.CustomTextEditorProvider {
  private readonly editorRegistry: EditorRegistry;
  private readonly eventProcessor: EventProcessor;

  constructor(
    private readonly extensionContext: vscode.ExtensionContext,
    private readonly svelteResources: SvelteResources
  ) {
    this.editorRegistry = new EditorRegistry();
    this.eventProcessor = new EventProcessor();
  }

  resolveCustomTextEditor(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel) {
    const editorContext: EditorContext = {
      webviewPanel,
      document,
      extensionContext: this.extensionContext,
      svelteResources: this.svelteResources,
      pendingDuplicateUpdates: 0,
    };
    this.editorRegistry.register(editorContext);

    webviewPanel.webview.options = { enableScripts: true };
    webviewPanel.webview.html = getHtmlForWebview(editorContext);

    vscode.commands.executeCommand("setContext", PROJECTIONAL_EDITOR_RUNNING_KEY, true);

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(async (event) =>
      this.eventProcessor.processDocumentChange(event, editorContext)
    );
    const changeConfigurationSubscription = vscode.workspace.onDidChangeConfiguration((event) =>
      this.eventProcessor.processConfigurationChange(event, editorContext)
    );
    const messageSubscription = webviewPanel.webview.onDidReceiveMessage(async (message) => {
      await this.eventProcessor.processMessage(message, editorContext);
    });

    webviewPanel.onDidDispose(() => {
      changeConfigurationSubscription.dispose();
      messageSubscription.dispose();
      changeDocumentSubscription.dispose();
      this.editorRegistry.unregister(editorContext);

      if (this.editorRegistry.numberOfEditors === 0) {
        vscode.commands.executeCommand("setContext", PROJECTIONAL_EDITOR_RUNNING_KEY, false);
      }
    });
  }

  reloadAllEditors() {
    this.editorRegistry.getAllEditorContexts().forEach((editorContext) => {
      editorContext.webviewPanel.webview.html = getHtmlForWebview(editorContext);
    });
  }
}
