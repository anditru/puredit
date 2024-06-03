import { ProjectionRegistry, type ProjectionPluginConfig } from "@puredit/projections";
import { globalContextVariables, globalContextInformation } from "./globalContext";
import { Language } from "@puredit/language-config";
import { Parser } from "@puredit/parser";
import { BrowserWasmPathProvider } from "@puredit/utils-browser";
import { projections } from "@puredit/py-db-sample";

const wasmPathProvider = new BrowserWasmPathProvider(Language.Python);
const parser = await Parser.load(Language.Python, wasmPathProvider);
const projectionRegistry = new ProjectionRegistry();
projectionRegistry.registerProjectionPackage("py-db-sample", projections);

export const projectionPluginConfig: ProjectionPluginConfig = {
  parser,
  globalContextVariables,
  globalContextInformation,
  projectionRegistry,
};
