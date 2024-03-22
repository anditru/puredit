import TreeSitterParser from "web-tree-sitter";
import { Language } from "@puredit/language-config";
import WasmPathProvider from "./wasmPathProvider";

export async function createTreeSitterParser(
  language: Language,
  wasmPathProvider: WasmPathProvider
): Promise<TreeSitterParser> {
  await TreeSitterParser.init({
    locateFile() {
      return wasmPathProvider.getTreeSitterPath();
    },
  });
  const languagePath = wasmPathProvider.getLanguagePath(language);
  const parser = new TreeSitterParser();
  const treeSitterLanguage = await TreeSitterParser.Language.load(languagePath);
  parser.setLanguage(treeSitterLanguage);
  return parser;
}

export type { TreeSitterParser };
