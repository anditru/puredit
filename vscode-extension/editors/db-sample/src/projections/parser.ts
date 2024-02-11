import { Language, Parser } from "@puredit/parser";

export const tsParser = await Parser.load(Language.TypeScript);
