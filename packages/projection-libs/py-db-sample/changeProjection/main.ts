import type { Text } from "@codemirror/state";
import { arg, block, contextVariable } from "@puredit/parser";
import type { Match } from "@puredit/parser";
import { stringLiteralValue } from "@puredit/projections/shared";
import { svelteProjection } from "@puredit/projections";
import type { ContextInformation, RootProjection } from "@puredit/projections";
import Widget from "./Widget.svelte";
import type { ContextColumns } from "../context";
import { parser } from "../parser";

const db = contextVariable("db");
const table = arg("table", ["string"]);

const pattern = parser.statementPattern("DBSample:ChangeTable")`
with ${db}.change(${table}) as table:
    ${block({ table: "table" })}
`;

const widget = svelteProjection(Widget);

interface InnerContext {
  columns: ContextColumns;
}

export const changeProjection: RootProjection = {
  pattern,
  description: "Applies changes to the specified table of the database",
  requiredContextVariables: ["db"],
  segmentWidgets: [widget],
  contextProvider(match: Match, text: Text, contextInformation: ContextInformation): InnerContext {
    const tableName = stringLiteralValue(match.argsToAstNodeMap.table, text);
    return {
      columns: contextInformation.tables[tableName]?.columns || {},
    };
  },
  subProjections: [],
};
