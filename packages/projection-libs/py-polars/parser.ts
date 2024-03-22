import { BrowserWasmPathProvider } from "@puredit/browser-utils";
import { Parser } from "@puredit/parser";
import { Language } from "@puredit/language-config";

const wasmPathProvider = new BrowserWasmPathProvider(Language.Python);
export const parser = await Parser.load(Language.Python, wasmPathProvider);
