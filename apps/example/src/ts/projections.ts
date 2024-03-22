import type { ProjectionPluginConfig } from "@puredit/projections";
import { globalContextVariables, globalContextInformation } from "./globalContext";
import { projections } from "@puredit/ts-db-sample";
import { Parser } from "@puredit/parser";
import { Language } from "@puredit/language-config";
import { BrowserWasmPathProvider } from "@puredit/browser-utils";

const wasmPathProvider = new BrowserWasmPathProvider(Language.TypeScript);
export const parser = await Parser.load(Language.TypeScript, wasmPathProvider);

export const projectionPluginConfig: ProjectionPluginConfig = {
  parser,
  globalContextVariables,
  globalContextInformation,
  projections,
};
