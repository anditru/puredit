import AstNode from "@puredit/parser/ast/node";
import { Language } from "../common";
import PythonUndeclaredVarSearch from "./pythonUndeclaredVarSearch";
import TypeScriptUndeclaredVarSearch from "./typeScriptUndeclaredVarSearch";

export function getUndeclaredVarSearchFor(language: Language, startNode: AstNode) {
  if (language === Language.Python) {
    return new PythonUndeclaredVarSearch(startNode);
  } else if (language === Language.TypeScript) {
    return new TypeScriptUndeclaredVarSearch(startNode);
  } else {
    throw new Error(`Detection of context variables not implemented for language ${language}`);
  }
}
