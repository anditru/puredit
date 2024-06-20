import { ProjectionRegistry, type ProjectionPluginConfig } from "@puredit/projections";
import { Language } from "@puredit/language-config";
import { projections as polarsProjections } from "@puredit/py-polars";
import { projections as pyTorchProjections } from "@puredit/py-pytorch";
import { Parser } from "@puredit/parser";
import { BrowserWasmPathProvider } from "@puredit/utils-browser";
import { ProjectionCompiler } from "@puredit/declarative-projections";
import { VsCodeMessenger } from "@puredit/editor-utils";
import { Action } from "@puredit/webview-interface";

const wasmPathProvider = new BrowserWasmPathProvider(Language.Python);
const parser = await Parser.load(Language.Python, wasmPathProvider);

const projectionRegistry = new ProjectionRegistry();
projectionRegistry.registerProjectionPackage("py-polars", polarsProjections);
projectionRegistry.registerProjectionPackage("py-pytorch", pyTorchProjections);

const vsCodeMessenger = VsCodeMessenger.getInstance();
const reportError = (error: string) => {
  vsCodeMessenger.sendRequest(Action.REPORT_ERROR, error);
};
const projectionCompiler = new ProjectionCompiler(parser, projectionRegistry, reportError);

export const projectionPluginConfig: ProjectionPluginConfig = {
  parser,
  globalContextVariables: {
    pl: undefined,
    torch: undefined,
  },
  globalContextInformation: {},
  projectionRegistry,
  projectionCompiler,
};
