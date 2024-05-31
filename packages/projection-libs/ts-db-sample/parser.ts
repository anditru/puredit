import { BrowserWasmPathProvider } from "@puredit/utils-browser";
import { Parser } from "@puredit/parser";
import { Language } from "@puredit/language-config";

const wasmPathProvider = new BrowserWasmPathProvider(Language.TypeScript);
export const parser = await Parser.load(Language.TypeScript, wasmPathProvider);
