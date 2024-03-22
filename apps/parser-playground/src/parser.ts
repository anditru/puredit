import { Parser } from "@puredit/parser";
import { Language } from "@puredit/language-config";
import { BrowserWasmPathProvider } from "@puredit/browser-utils";

const wasmPathProvider = new BrowserWasmPathProvider(Language.TypeScript);
export const parser = await Parser.load(Language.TypeScript, wasmPathProvider);
