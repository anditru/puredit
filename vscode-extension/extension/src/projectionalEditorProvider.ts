import * as vscode from "vscode";
import { EventProcessor } from "./eventProcessor";
import { getHtmlForWebview } from "./bootstrap";
import { EditorContext, EditorRegistry, SvelteResources } from "./editorRegistry";

const PROJECTIONAL_EDITOR_RUNNING_KEY = "projectionalEditorRunning";

/**
 * @class
 * Provides instances of the projectional editor as webviews.
 */
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

  /**
   * Creates the HTML for the webview and registers handlers to process messages sent from the
   * webview to keep the document and the weview in sync.
   * @param document
   * @param webviewPanel
   */
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

  /**
   * Recreates the HTML for the vewviews of all editors when the button
   * "Reload all projectional editors" button is pressed or it is required
   * by a configuration change.
   */
  reloadAllEditors() {
    this.editorRegistry.getAllEditorContexts().forEach((editorContext) => {
      editorContext.webviewPanel.webview.html = getHtmlForWebview(editorContext);
    });
  }
}
