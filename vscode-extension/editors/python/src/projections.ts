import type { ProjectionPluginConfig } from "@puredit/projections";
import { Language } from "@puredit/language-config";
import { projections as polarsProjections } from "@puredit/py-polars";
import { projections as pyTorchProjections } from "@puredit/py-pytorch";
import { Parser } from "@puredit/parser";
import { BrowserWasmPathProvider } from "@puredit/utils-browser";

const wasmPathProvider = new BrowserWasmPathProvider(Language.Python);
const parser = await Parser.load(Language.Python, wasmPathProvider);

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
};
