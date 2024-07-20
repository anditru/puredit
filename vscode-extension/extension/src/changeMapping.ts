/**
 * @module
 * Provides utility functions to map changes communicated by the projectional editors
 * to vscode.WorkspaceEdits and vice versa.
 */

import * as vscode from "vscode";
import { ChangeDocumentPayload, ChangeEditorPayload, ChangeType } from "@puredit/webview-interface";
import { DocumentState } from "./documentRegistry";

export function mapToChangeSpec(
  contentChange: vscode.TextDocumentContentChangeEvent,
  documentState: DocumentState
): ChangeEditorPayload {
  const text = documentState.text;
  let fromChar = contentChange.rangeOffset;
  let toChar = fromChar + contentChange.rangeLength;
  let insert = contentChange.text;

  if (documentState.eol === vscode.EndOfLine.CRLF) {
    fromChar = fromChar - lineAt(text, "\r\n", fromChar);
    toChar = toChar - lineAt(text, "\r\n", toChar);
    insert = insert.replace(/\r\n/g, "\n");
  }

  return {
    from: fromChar,
    to: toChar,
    insert,
  };
}

export function mapToWorkspaceEdit(
  changePayload: ChangeDocumentPayload,
  document: vscode.TextDocument
): vscode.WorkspaceEdit {
  const workspaceEdit = new vscode.WorkspaceEdit();
  if (changePayload.type === ChangeType.INSERTION) {
    const position = document.positionAt(changePayload.from);
    workspaceEdit.insert(document.uri, position, changePayload.insert);
  } else if (changePayload.type === ChangeType.REPLACEMENT) {
    const range = buildRange(changePayload, document);
    workspaceEdit.replace(document.uri, range, changePayload.insert);
  } else if (changePayload.type === ChangeType.DELETION) {
    const range = buildRange(changePayload, document);
    workspaceEdit.delete(document.uri, range);
  }
  return workspaceEdit;
}

function buildRange(
  changePayload: ChangeDocumentPayload,
  document: vscode.TextDocument
): vscode.Range {
  const positionFrom = document.positionAt(changePayload.from);
  const positionTo = document.positionAt(changePayload.to);
  return new vscode.Range(positionFrom, positionTo);
}

function lineAt(document: string, lineSeparator: string, charIndex: number): number {
  if (charIndex < 0 || charIndex > document.length) {
    throw new Error("Character index out of bounds");
  }
  let line = 0;
  let i = 0;
  while (i < charIndex) {
    if (
      document.charAt(i + lineSeparator.length - 1) &&
      document.slice(i, i + lineSeparator.length) === lineSeparator
    ) {
      line++;
      i += lineSeparator.length;
    } else {
      i++;
    }
  }
  return line;
}
