import { BrowserWasmPathProvider } from "@puredit/browser-utils";
import { Parser } from "@puredit/parser";
import { Language } from "@puredit/language-config";

const wasmPathProvider = new BrowserWasmPathProvider(Language.TypeScript);
export const parser = await Parser.load(Language.TypeScript, wasmPathProvider);
