import type { ProjectionPluginConfig } from "@puredit/projections";
import { Language } from "@puredit/language-config";
import { projections as polarsProjections } from "@puredit/py-polars";
import { projections as pyTorchProjections } from "@puredit/py-pytorch";
import { Parser } from "@puredit/parser";
import { BrowserWasmPathProvider } from "@puredit/browser-utils";
import { PackageExtender } from "@puredit/package-extension";
import { parseExtensions } from "@puredit/editor-utils";

const wasmPathProvider = new BrowserWasmPathProvider(Language.Python);
const parser = await Parser.load(Language.Python, wasmPathProvider);
const packageExtender = new PackageExtender(parser);

const polarsExtensions = await parseExtensions("../editors/python/polars.ext.json");
const extendedPolarsProjections = packageExtender.extendPackage(
  polarsProjections,
  polarsExtensions
);
const pyTorchExtensions = await parseExtensions("../editors/python/pytorch.ext.json");
const extendedPyTorchProjections = packageExtender.extendPackage(
  pyTorchProjections,
  pyTorchExtensions
);

export const projectionPluginConfig: ProjectionPluginConfig = {
  parser,
  globalContextVariables: {
    pl: undefined,
    torch: undefined,
  },
  globalContextInformation: {},
  projections: [...extendedPolarsProjections, ...extendedPyTorchProjections],
};
