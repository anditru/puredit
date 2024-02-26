import type { ProjectionPluginConfig } from "@puredit/projections";
import { globalContextValues, globalContextVariables } from "./context";
import { Language } from "@puredit/language-config";
import { projections as polarsProjections } from "@puredit/py-polars";
import { projections as latexMathProjections } from "@puredit/py-latex-math";
import { Parser } from "@puredit/parser";

const parser = await Parser.load(Language.Python);

export const projectionPluginConfig: ProjectionPluginConfig = {
  parser,
  globalContextVariables,
  globalContextValues,
  projections: [...polarsProjections, ...latexMathProjections],
};
