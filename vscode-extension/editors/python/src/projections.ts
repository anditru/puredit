import type { ProjectionPluginConfig } from "@puredit/projections";
import { Language } from "@puredit/language-config";
import { projections as polarsProjections } from "@puredit/py-polars";
import { projections as pyTorchProjections } from "@puredit/py-pytorch";
import { Parser } from "@puredit/parser";
import { BrowserWasmPathProvider } from "@puredit/utils-browser";
import { ProjectionInserter } from "@puredit/declarative-projections";
import { VsCodeMessenger } from "@puredit/editor-utils";
import { Action } from "@puredit/editor-interface";

const wasmPathProvider = new BrowserWasmPathProvider(Language.Python);
const parser = await Parser.load(Language.Python, wasmPathProvider);
const vsCodeMessenger = VsCodeMessenger.getInstance();
const reportError = (error: string) => {
  vsCodeMessenger.sendRequest(Action.REPORT_ERROR, error);
};
const projectionInserter = new ProjectionInserter(parser, reportError);

export const projectionPluginConfig: ProjectionPluginConfig = {
  parser,
  globalContextVariables: {
    pl: undefined,
    torch: undefined,
  },
  globalContextInformation: {},
  projections: {
    "py-polars": polarsProjections,
    "py-pytorch": pyTorchProjections,
  },
  projectionInserter,
};
