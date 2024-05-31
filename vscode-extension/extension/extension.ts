import * as vscode from "vscode";
import { ProjectionalEditorProvider } from "./projectionalEditorProvider";
import { getLanguageService } from "vscode-json-languageservice";
import { schema } from "./projectionExtensionSchema";

const extensionLanguageService = getLanguageService({
  schemaRequestService: (uri) => {
    if (uri === "file:///config.schema.json") {
      return Promise.resolve(JSON.stringify(schema));
    }
    return Promise.reject(`Invalid uri ${uri}`);
  },
});
extensionLanguageService.configure({
  allowComments: false,
  schemas: [{ fileMatch: ["config.json"], uri: "config.schema.json" }],
});

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    ProjectionalEditorProvider.register(
      context,
      "pureditcode.PythonEditor",
      {
        scriptPath: "editors/python/index.js",
        stylePath: "editors/python/index.css",
      },
      extensionLanguageService
    )
  );
}
