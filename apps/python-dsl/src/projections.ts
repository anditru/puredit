import type { ProjectionPluginConfig } from "@puredit/projections";
import { globalContextVariables, globalContextInformation } from "./globalContext";
import { Language } from "@puredit/language-config";
import { Parser } from "@puredit/parser";
import { projections } from "@puredit/py-db-sample";

export const parser = await Parser.load(Language.Python);
export const projectionPluginConfig: ProjectionPluginConfig = {
  parser,
  globalContextVariables,
  globalContextInformation,
  projections,
};
