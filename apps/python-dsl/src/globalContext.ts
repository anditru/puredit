import { ContextInformation, ContextVariableMap } from "@puredit/projections";

export const globalContextVariables: ContextVariableMap = {
  db: "db",
};

export const globalContextInformation: ContextInformation = {
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
