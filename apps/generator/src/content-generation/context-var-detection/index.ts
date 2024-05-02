import AstNode from "@puredit/parser/ast/node";
import { Language } from "../common";
import PythonUndeclaredVarSearch from "./pythonUndeclaredVarSearch";
import TypeScriptUndeclaredVarSearch from "./typeScriptUndeclaredVarSearch";
import { BlockVariableMap } from "./blockVariableMap";
import inquirer from "inquirer";
import TemplateArgument from "../template/argument";
import TemplateParameter from "../template/parameter";
import TemplateContextVariable from "../template/contextVariable";

export async function handleUndeclaredVariables(samples: AstNode[], language: Language) {
  const undeclaredVariableMap = findUndeclaredVariables(samples, language as Language);
  const undeclaredVariables = undeclaredVariableMap.getAll();
  let usages: string[] = [];

  if (process.env.DEBUG && undeclaredVariables.length) {
    if (!process.env.UNDECLARED_VAR_USAGES) {
      throw new Error("Please provide undeclared variable usages");
    }
    usages = JSON.parse(process.env.UNDECLARED_VAR_USAGES);
  } else if (!process.env.DEBUG && undeclaredVariables.length) {
    const questions = undeclaredVariables.map((variable) => ({
      type: "list",
      name: "usage",
      message: `Found potential context variable ${variable.name} how to you want to use it?`,
      choices: [
        { name: "Context Variable", value: "c" },
        { name: "Template Argument", value: "a" },
        { name: "Ignore", value: "i" },
      ],
    }));
    const answers = await inquirer.prompt(questions);
    usages = Array.isArray(answers)
      ? answers.map((answer: { usage: any }) => answer.usage)
      : [answers.usage];
  }

  let templateParameters: TemplateParameter[] = [];
  usages.forEach((usage: string, index: number) => {
    const variable = undeclaredVariables[index];
    switch (usage) {
      case "a":
        undeclaredVariableMap.deleteVariable(variable.path);
        templateParameters.push(new TemplateArgument(variable.path, ["identifier"]));
        break;
      case "i":
        undeclaredVariableMap.deleteVariable(variable.path);
        break;
      case "c":
        break;
      default:
        throw new Error(`Invalid usage ${usage} for undeclared variable`);
    }
  });

  const undeclaredVarsAsContextVars = undeclaredVariableMap.getAll();
  const contextVariables = undeclaredVarsAsContextVars.map(
    (variable) => new TemplateContextVariable(variable.path, variable.name)
  );
  templateParameters = templateParameters.concat(contextVariables);
  return { undeclaredVariableMap, templateParameters };
}

function findUndeclaredVariables(samples: AstNode[], language: Language): BlockVariableMap {
  let undeclaredVariableSearch = getUndeclaredVarSearchFor(language, samples[0]);
  const undeclaredVariableMap: BlockVariableMap = undeclaredVariableSearch.execute();
  samples.slice(1).forEach((sample) => {
    undeclaredVariableSearch = getUndeclaredVarSearchFor(language, sample);
    const newUndeclaredVariableMap = undeclaredVariableSearch.execute();
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
