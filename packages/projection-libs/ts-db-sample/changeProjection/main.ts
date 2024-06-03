import type { Text } from "@codemirror/state";
import { arg, block, contextVariable } from "@puredit/parser";
import type { Match } from "@puredit/parser";
import { span, staticWidget, stringLiteralValue } from "@puredit/projections/shared";
import { svelteProjection } from "@puredit/projections";
import type { ContextInformation, RootProjection } from "@puredit/projections/types";
import Widget from "./Widget.svelte";
import type { ContextColumns } from "../context";
import { parser } from "../parser";

const db = contextVariable("db");
const table = arg("table", ["string"]);
export const pattern = parser.statementPattern("DBSample:ChangeTable")`((table) => ${block({
  table: "table",
})})(${db}[${table}]);`;

export const widget = svelteProjection(Widget);
export const end = staticWidget(() => span("end change"));

interface InnerContext {
  columns: ContextColumns;
}

export const changeProjection: RootProjection = {
  pattern,
  description: "Applies changes to the specified table of the database",
  requiredContextVariables: ["db"],
  segmentWidgets: [widget, end],
  contextProvider(match: Match, text: Text, contextInformation: ContextInformation): InnerContext {
    const tableName = stringLiteralValue(match.argsToAstNodeMap.table, text);
    return {
      columns: contextInformation.tables[tableName]?.columns || {},
    };
  },
  subProjections: [],
};
