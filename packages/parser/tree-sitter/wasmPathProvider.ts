import { Language } from "@puredit/language-config";

export default interface WasmPathProvider {
  getTreeSitterPath(): string;
  getLanguagePath(language: Language): string;
}
