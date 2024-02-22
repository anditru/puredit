import { Parser } from "@puredit/parser";
import { Language } from "@puredit/language-config";

export const pythonParser = await Parser.load(Language.Python);
