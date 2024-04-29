import AstNode from "@puredit/parser/ast/node";
import { Language } from "../common";
import PythonUndeclaredVarSearch from "./pythonUndeclaredVarSearch";
import TypeScriptUndeclaredVarSearch from "./typeScriptUndeclaredVarSearch";
import { BlockVariableMap } from "./blockVariableMap";

export function findUndeclaredVariables(
  samples: AstNode[],
  language: Language,
  ignoreBlocks: boolean
): BlockVariableMap {
  let undeclaredVariableSearch = getUndeclaredVarSearchFor(language, samples[0]);
  const undeclaredVariableMap: BlockVariableMap = undeclaredVariableSearch.execute(ignoreBlocks);
  samples.slice(1).forEach((sample) => {
    undeclaredVariableSearch = getUndeclaredVarSearchFor(language, sample);
    const newUndeclaredVariableMap = undeclaredVariableSearch.execute(ignoreBlocks);
    undeclaredVariableMap.setIntersections(newUndeclaredVariableMap);
  });
  return undeclaredVariableMap;
}

function getUndeclaredVarSearchFor(language: Language, startNode: AstNode) {
  if (language === Language.Python) {
    return new PythonUndeclaredVarSearch(startNode);
  } else if (language === Language.TypeScript) {
    return new TypeScriptUndeclaredVarSearch(startNode);
  } else {
    throw new Error(`Detection of context variables not implemented for language ${language}`);
  }
}
