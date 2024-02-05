import type { Text } from "@codemirror/state";
import { arg, block, contextVariable } from "@puredit/parser";
import type { Match } from "@puredit/parser";
import { span, staticWidget, stringLiteralValue } from "@puredit/projections/shared";
import { svelteProjection } from "@puredit/projections/svelte";
import type { Projection } from "@puredit/projections/types";
import ChangeProjection from "./ChangeProjection.svelte";
import type { ContextColumns, ContextTables } from "./context";
import { tsParser } from "./parser";

const db = contextVariable("db");
const table = arg("table", ["string"]);

export const pattern = tsParser.statementPattern("changeTable")`
((table) => ${block({ table: "table" })})(${db}[${table}]);
`;

export const widget = svelteProjection(ChangeProjection);

export const end = staticWidget(() => span("end change"));

interface OuterContext {
  tables: ContextTables;
}

interface InnerContext {
  columns: ContextColumns;
}

export const changeProjection: Projection = {
  name: "change table",
  description: "Applies changes to the specified table of the database",
  pattern,
  requiredContextVariables: ["db"],
  widgets: [widget, end],
  contextProvider(match: Match, text: Text, context: OuterContext): InnerContext {
    const tableName = stringLiteralValue(match.args.table, text);
    return {
      columns: context.tables[tableName]?.columns || {},
    };
  },
};
