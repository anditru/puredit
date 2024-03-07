export type ContextColumns = Record<string, "TEXT" | "INTEGER">;

export interface ContextTable {
  columns: ContextColumns;
}

export type ContextTables = Record<string, ContextTable>;

export interface ContextGlobal {
  tables: ContextTables;
}
