import { arg } from "@puredit/parser";
import type { RootProjection } from "@puredit/projections/types";
import { simpleProjection } from "@puredit/simple-projection";
import { tsParser } from "./parser";

const message = arg("message", ["string"]);

export const pattern = tsParser.statementPattern("logMessage")`
console.log(${message});
`;

export const widget = simpleProjection(["log", message, "to console"]);

export const logProjection: RootProjection = {
  name: "log message",
  description: "Log a message to the console",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
