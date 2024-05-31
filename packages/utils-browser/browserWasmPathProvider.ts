import { Language } from "@puredit/language-config";
import { WasmPathProvider } from "@puredit/parser";
const VSCODE_BASE_PATH = /^https:\/\/.*\.vscode-resource\.vscode-cdn\.net/;

export default class BrowserWasmPathProvider implements WasmPathProvider {
  constructor(private readonly language: Language) {}

  getTreeSitterPath(): string {
    if (this.runningInVsCode()) {
      return "./wasm/tree-sitter.wasm";
    } else {
      const url = new URL("../parser/wasm/tree-sitter.wasm", import.meta.url);
      return this.stripFileProtocol(url.href);
    }
  }

  getLanguagePath(): string {
    const languagePath = this.parserUrl(this.language);
    const strippedLanguagePath = this.stripFileProtocol(languagePath);
    return strippedLanguagePath;
  }

  /**
   * Removes the `file://` protocol prefix.
   * Required for using `new URL(url, import.meta.url)` in jest / node.
   */
  private stripFileProtocol(href: string): string {
    if (typeof process !== "undefined" && process.platform === "win32") {
      return href.replace(/^file:\/\/\//, "");
    }
    return href.replace(/^file:\/\//, "");
  }

  private parserUrl(target: Language): string {
    if (this.runningInVsCode()) {
      return `./wasm/tree-sitter-${target}.wasm`;
    } else {
      return new URL(`../parser/wasm/tree-sitter-${target}.wasm`, import.meta.url).href;
    }
  }

  private runningInVsCode(): boolean {
    return !!import.meta.url.match(VSCODE_BASE_PATH);
  }
}
