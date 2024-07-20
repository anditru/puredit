import * as vscode from "vscode";
import { Action, ChangeDocumentPayload, Message, MessageType } from "@puredit/webview-interface";
import * as fs from "fs";
import { v4 as uuid } from "uuid";
import { mapToChangeSpec, mapToWorkspaceEdit } from "./changeMapping";
import { getHtmlForWebview } from "./bootstrap";
import { EditorContext } from "./editorRegistry";
import DocumentRegistry from "./documentRegistry";
import { load } from "js-yaml";
import { validateSchema } from "./descriptorValidation";

/**
 * @class
 * Stateless service class that provides handler methods for events
 * issued by the webviews containing the projectional editors.
 * Messages can be caused by:
 * - Document changes
 * - Configuration changes
 * - Messages @see processMessage
 */
export class EventProcessor {
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
      } else if (context.pendingDuplicateUpdates === 0 && event.contentChanges.length) {
        event.contentChanges.forEach((contentChange) => {
          context.webviewPanel.webview.postMessage({
            id: uuid(),
            type: MessageType.REQUEST,
            action: Action.UPDATE_EDITOR,
            payload: mapToChangeSpec(contentChange, oldDocumentState),
          });
        });
      } else if (context.pendingDuplicateUpdates > 0 && event.contentChanges.length) {
        context.pendingDuplicateUpdates -= 1;
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
    if (event.affectsConfiguration("puredit.rematchingDelay")) {
      let delay = getConfig<number>("rematchingDelay");
      if (!delay || delay < 0) {
        vscode.window.showErrorMessage(
          `Invalid rematching delay. Value must be greater than 0. Defaulting to 200.`
        );
        delay = 200;
      }
      context.webviewPanel.webview.postMessage({
        id: uuid(),
        type: MessageType.REQUEST,
        action: Action.UPDATE_REMATCHING_DELAY,
        payload: delay,
      });
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
      case Action.GET_REMATCHING_DELAY:
        this.processGetRematchingDelay(message, context);
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
    context.pendingDuplicateUpdates += 1;
    await vscode.workspace.applyEdit(workspaceEdit);
    context.webviewPanel.webview.postMessage({
      id: message.id,
      type: MessageType.RESPONSE,
      action: Action.UPDATE_DOCUMENT,
    });
  }

  private async processGetDeclarativeProjections(message: Message, context: EditorContext) {
    const descriptorPaths = getConfig<string[]>("declarativeProjectionDescriptors") || [];
    const extensions = await this.readDeclarativeProjections(descriptorPaths);
    context.webviewPanel.webview.postMessage({
      id: message.id,
      type: MessageType.RESPONSE,
      action: Action.GET_DECLARATIVE_PROJECTIONS,
      payload: JSON.stringify(extensions),
    });
  }

  private processGetDisabledPackages(message: Message, context: EditorContext) {
    const enabledPackages = getConfig<Record<string, boolean>>("enabledPackages") || {};
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

  private processGetRematchingDelay(message: Message, context: EditorContext) {
    let rematchingDelay = getConfig<number>("rematchingDelay");
    if (rematchingDelay == null) {
      rematchingDelay = 200;
    }
    context.webviewPanel.webview.postMessage({
      id: message.id,
      type: MessageType.RESPONSE,
      action: Action.GET_REMATCHING_DELAY,
      payload: rematchingDelay,
    });
  }

  private async readDeclarativeProjections(descriptorPaths: string[]) {
    let extensions: any[] = [];
    for (const descriptorPath of descriptorPaths) {
      let descriptorString: string;
      try {
        descriptorString = fs.readFileSync(descriptorPath, "utf-8");
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to read extension descriptor path ${descriptorPath}.`
        );
        continue;
      }
      let descriptor;
      if (descriptorPath.endsWith(".json")) {
        descriptor = JSON.parse(descriptorString);
      } else if (descriptorPath.endsWith(".yaml") || descriptorPath.endsWith(".json")) {
        descriptor = load(descriptorString);
      } else {
        vscode.window.showErrorMessage(
          `Unsupported descriptor format in file ${descriptorPath}. Only JSON and YAML are supported.`
        );
      }
      if (validateSchema(descriptor)) {
        extensions = extensions.concat(descriptor);
      } else {
        vscode.window.showErrorMessage(
          `Invalid descriptor syntax in file ${descriptorPath}. Open the file for details.`
        );
      }
    }
    return extensions;
  }
}

function getConfig<T>(name: string) {
  const config = vscode.workspace.getConfiguration("puredit");
  return config.get<T>(name);
}
