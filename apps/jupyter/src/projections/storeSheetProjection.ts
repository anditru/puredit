import { arg, contextVariable } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections";
import type { RootProjection } from "@puredit/projections/types";
import { pythonParser } from "./parser";
import StoreSheetProjection from "./StoreSheetProjection.svelte";

const dsl = contextVariable("dsl");
const fileName = arg("fileName", ["string"]);
const sheetName = arg("sheetName", ["string"]);
const columns = arg("columns", ["list"]);

export const pattern = pythonParser.statementPattern("storeSheet")`
${dsl}.store_sheet(${fileName}, ${sheetName}, ${columns})
`;

export const widget = svelteProjection(StoreSheetProjection);

export const storeSheetProjection: RootProjection = {
  name: "store sheet",
  description: "Stores the given columns as an Excel file",
  pattern,
  requiredContextVariables: ["dsl"],
  segmentWidgets: [widget],
};
