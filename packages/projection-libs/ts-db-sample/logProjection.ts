import { arg } from "@puredit/parser";
import { RootProjection, simpleProjection } from "@puredit/projections";
import { parser } from "./parser";

const message = arg("message", ["string"]);

export const pattern = parser.statementPattern("DBSample:LogMessage")`
console.log(${message});
`;

export const widget = simpleProjection(["log", message, "to console"]);

export const logProjection: RootProjection = {
  pattern,
  description: "Log a message to the console",
  requiredContextVariables: [],
  segmentWidgets: [widget],
  subProjections: [],
};
