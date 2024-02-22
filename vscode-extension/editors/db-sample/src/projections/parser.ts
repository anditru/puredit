import { Parser } from "@puredit/parser";
import { Language } from "@puredit/language-config";

export const tsParser = await Parser.load(Language.TypeScript);
