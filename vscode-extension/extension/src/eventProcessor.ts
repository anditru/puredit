import * as vscode from "vscode";
import { Action, ChangeDocumentPayload, Message, MessageType } from "@puredit/webview-interface";
import { Diagnostic, LanguageService, TextDocument } from "vscode-json-languageservice";
import * as fs from "fs";
import { v4 as uuid } from "uuid";
import { mapToChangeSpec, mapToWorkspaceEdit } from "./changeMapping";
import { getHtmlForWebview } from "./bootstrap";
import { EditorContext } from "./editorRegistry";
import DocumentRegistry from "./documentRegistry";

export class EventProcessor {
  private pendingDuplicateUpdates = 0;

  constructor(private readonly extensionLanguageService: LanguageService) {}

  processDocumentChange(event: vscode.TextDocumentChangeEvent, context: EditorContext) {
    const oldDocumentState = DocumentRegistry.instance.get(event.document);
    if (!oldDocumentState) {
      return;
    }
    if (event.document.uri.toString() === context.document.uri.toString()) {
      if (event.document.eol !== oldDocumentState.eol) {
        context.webviewPanel.webview.postMessage({
          id: uuid(),
          type: MessageType.REQUEST,
          action: Action.UPDATE_EOL,
          payload: event.document.eol,
        });
      } else if (this.pendingDuplicateUpdates === 0 && event.contentChanges.length) {
        event.contentChanges.forEach((contentChange) => {
          context.webviewPanel.webview.postMessage({
            id: uuid(),
            type: MessageType.REQUEST,
            action: Action.UPDATE_EDITOR,
            payload: mapToChangeSpec(contentChange, oldDocumentState),
          });
        });
      } else if (this.pendingDuplicateUpdates > 0 && event.contentChanges.length) {
        this.pendingDuplicateUpdates -= 1;
      }
      DocumentRegistry.instance.update(event.document);
    }
  }

  processConfigurationChange(event: vscode.ConfigurationChangeEvent, context: EditorContext) {
    if (
      event.affectsConfiguration("puredit.declarativeProjectionDescriptors") ||
      event.affectsConfiguration("puredit.enabledPackages")
    ) {
      context.webviewPanel.webview.html = getHtmlForWebview(context);
    }
  }

  async processMessage(message: Message, context: EditorContext) {
    switch (message.action) {
      case Action.GET_DOCUMENT:
        this.processGetDocument(message, context);
        break;
      case Action.UPDATE_DOCUMENT:
        await this.processUpdateDocument(message, context);
        break;
      case Action.GET_DECLARATIVE_PROJECTIONS:
        this.processGetDeclarativeProjections(message, context);
        break;
      case Action.GET_DISABLED_PACKAGES:
        this.processGetDisabledPackages(message, context);
        break;
      case Action.GET_EOL:
        this.processGetEol(message, context);
        break;
      case Action.REPORT_ERROR:
        vscode.window.showErrorMessage(message.payload);
        break;
    }
  }

  private processGetDocument(message: Message, context: EditorContext) {
    context.webviewPanel.webview.postMessage({
      id: message.id,
      type: MessageType.RESPONSE,
      action: Action.GET_DOCUMENT,
      payload: context.document.getText(),
    });
  }

  private async processUpdateDocument(message: Message, context: EditorContext) {
    const workspaceEdit = mapToWorkspaceEdit(
      message.payload! as ChangeDocumentPayload,
      context.document
    );
    this.pendingDuplicateUpdates += 1;
    await vscode.workspace.applyEdit(workspaceEdit);
    context.webviewPanel.webview.postMessage({
      id: message.id,
      type: MessageType.RESPONSE,
      action: Action.UPDATE_DOCUMENT,
    });
  }

  private async processGetDeclarativeProjections(message: Message, context: EditorContext) {
    const config = vscode.workspace.getConfiguration("puredit");
    const descriptorPaths = config.get<string[]>("declarativeProjectionDescriptors") || [];
    const extensions = await this.readDeclarativeProjections(descriptorPaths);
    context.webviewPanel.webview.postMessage({
      id: message.id,
      type: MessageType.RESPONSE,
      action: Action.GET_DECLARATIVE_PROJECTIONS,
      payload: JSON.stringify(extensions),
    });
  }

  private processGetDisabledPackages(message: Message, context: EditorContext) {
    const config = vscode.workspace.getConfiguration("puredit");
    const enabledPackages = config.get<Record<string, boolean>>("enabledPackages") || {};
    const disabledPackages = Object.keys(enabledPackages).filter((key) => !enabledPackages[key]);
    context.webviewPanel.webview.postMessage({
      id: message.id,
      type: MessageType.RESPONSE,
      action: Action.GET_DISABLED_PACKAGES,
      payload: JSON.stringify(disabledPackages),
    });
  }

  private processGetEol(message: Message, context: EditorContext) {
    const documentState = DocumentRegistry.instance.get(context.document);
    if (!documentState) {
      throw new Error(`Cannot get EOL for unknown document ${context.document.uri.toString()}`);
    }
    context.webviewPanel.webview.postMessage({
      id: message.id,
      type: MessageType.RESPONSE,
      action: Action.GET_EOL,
      payload: documentState.eol,
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
}
