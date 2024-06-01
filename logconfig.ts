import { LogLevel } from "typescript-logging";
import { Log4TSProvider } from "typescript-logging-log4ts-style";

export const logProvider = Log4TSProvider.createProvider("Puredit", {
  level: LogLevel.Info,
  groups: [
    {
      identifier: "parser",
      expression: new RegExp("parser.+"),
    },
    {
      identifier: "projections",
      expression: new RegExp("projections.+"),
      level: LogLevel.Debug,
    },
    {
      identifier: "codemirror-typescript",
      expression: new RegExp("codemirror-typescript.+"),
    },
    {
      identifier: "vscode.editor-utils",
      expression: new RegExp("vscode.editor-utils.+"),
      level: LogLevel.Debug,
    },
    {
      identifier: "vscode.editor-interface",
      expression: new RegExp("vscode.editor-interface.+"),
    },
  ],
});
