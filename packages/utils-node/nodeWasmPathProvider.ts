import { Language } from "@puredit/language-config";
import { WasmPathProvider } from "@puredit/parser";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default class NodeWasmPathProvider implements WasmPathProvider {
  constructor(private readonly language: Language) {}

  getTreeSitterPath(): string {
    return path.resolve(__dirname, "../parser/wasm/tree-sitter.wasm");
  }

  getLanguagePath(): string {
    return path.resolve(__dirname, `../parser/wasm/tree-sitter-${this.language}.wasm`);
  }
}
