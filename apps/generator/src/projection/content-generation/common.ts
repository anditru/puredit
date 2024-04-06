export enum Language {
  Python = "py",
  TypeScript = "ts",
}

export const supportedLanguages: Language[] = [Language.Python, Language.TypeScript];
export const newline = process.platform === "win32" ? "\r\n" : "\n";
export const doubleNewline = newline + newline;
