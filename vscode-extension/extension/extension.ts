import * as vscode from "vscode";
import { ProjectionalEditorProvider } from "./projectionalEditorProvider";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    ProjectionalEditorProvider.register(context, "pureditcode.PythonEditor", {
      scriptPath: "editors/python/index.js",
      stylePath: "editors/python/index.css",
    })
  );
}
