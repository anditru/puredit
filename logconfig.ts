import { LogLevel } from "typescript-logging";
import { Log4TSProvider } from "typescript-logging-log4ts-style";

export const logProvider = Log4TSProvider.createProvider("PureditLogProvider", {
  level: LogLevel.Error,
  groups: [
    {
      identifier: "all",
      expression: new RegExp(".+"),
    },
    {
      identifier: "parser",
      expression: new RegExp("parser.+"),
    },
  ],
});
