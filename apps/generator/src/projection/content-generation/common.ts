export enum Language {
  Python = "py",
  TypeScript = "ts",
}
export interface Range {
  from: number;
  to: number;
}
export const supportedLanguages: Language[] = [Language.Python, Language.TypeScript];
export const newline = process.platform === "win32" ? "\r\n" : "\n";
export const doubleNewline = newline + newline;
