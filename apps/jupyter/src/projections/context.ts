export type ContextColumns = Record<string, "TEXT" | "INTEGER">;

export interface ContextTable {
  columns: ContextColumns;
}

export type ContextTables = Record<string, ContextTable>;

export interface ContextGlobal {
  tables: ContextTables;
}

export const globalContextInformation: ContextGlobal = {
  tables: {
    students: {
      columns: {
        name: "TEXT",
        firstName: "TEXT",
        secondName: "TEXT",
        age: "INTEGER",
      },
    },
    lectures: {
      columns: {
        name: "TEXT",
        lecturer: "TEXT",
      },
    },
  },
};
