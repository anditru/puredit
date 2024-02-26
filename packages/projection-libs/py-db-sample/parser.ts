import { Parser } from "@puredit/parser";
import { Language } from "@puredit/language-config";

export const parser = await Parser.load(Language.Python);
