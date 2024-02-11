import { Language, Parser } from "@puredit/parser";

export const parser = await Parser.load(Language.TypeScript);
