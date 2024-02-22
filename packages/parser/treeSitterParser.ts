import TreeSitterParser from "web-tree-sitter";
import { Language } from "@puredit/language-config";

const VSCODE_BASE_PATH = "https://file+.vscode-resource.vscode-cdn.net";

/**
 * Removes the `file://` protocol prefix.
 * Required for using `new URL(url, import.meta.url)` in jest / node.
 */
function stripFileProtocol(href: string): string {
  if (typeof process !== "undefined" && process.platform === "win32") {
    return href.replace(/^file:\/\/\//, "");
  }
  return href.replace(/^file:\/\//, "");
}

function parserUrl(target: Language): URL {
  switch (target) {
    case Language.TypeScript:
      return new URL("./wasm/tree-sitter-typescript.wasm", import.meta.url);
    case Language.Python:
      return new URL("./wasm/tree-sitter-python.wasm", import.meta.url);
  }
}

function parserUrlVscode(target: Language): string {
  switch (target) {
    case Language.TypeScript:
      return "./wasm/tree-sitter-typescript.wasm";
    case Language.Python:
      return "./wasm/tree-sitter-python.wasm";
  }
}

function runningInVsCode(): boolean {
  return import.meta.url.startsWith(VSCODE_BASE_PATH);
}

export async function createTreeSitterParser(type: Language): Promise<TreeSitterParser> {
  await TreeSitterParser.init({
    locateFile(path: string, prefix: string) {
      if (path === "tree-sitter.wasm" && !runningInVsCode()) {
        const url = new URL("./wasm/tree-sitter.wasm", import.meta.url);
        return stripFileProtocol(url.href);
      } else if (path === "tree-sitter.wasm" && runningInVsCode()) {
        return "./wasm/tree-sitter.wasm";
      }
      return prefix + path;
    },
  });
  const parser = new TreeSitterParser();
  let languagePath;
  if (runningInVsCode()) {
    languagePath = parserUrlVscode(type);
  } else {
    languagePath = parserUrl(type).href;
  }
  const language = await TreeSitterParser.Language.load(stripFileProtocol(languagePath));
  parser.setLanguage(language);
  return parser;
}

export type { TreeSitterParser };
