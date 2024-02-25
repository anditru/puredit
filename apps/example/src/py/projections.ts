import type { ProjectionPluginConfig } from "@puredit/projections";
import { globalContextValues, globalContextVariables } from "./context";
import { Language } from "@puredit/language-config";
import { loadProjectionPackages } from "@puredit/projection-lib";
import { Parser } from "@puredit/parser";

// import { evaluateMathProjection } from "./evaluateMathProjection";
// import { compileMathProjection } from "./compileMathProjection";

const parser = await Parser.load(Language.Python);

export const projectionPluginConfig: ProjectionPluginConfig = {
  parser,
  globalContextVariables,
  globalContextValues,
  ...loadProjectionPackages(Language.Python, "polars", "latexMath"),
};
