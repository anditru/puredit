import type { ProjectionPluginConfig } from "@puredit/projections";
import { globalContextVariables, globalContextInformation } from "./globalContext";
import { projections } from "@puredit/ts-db-sample";
import { Parser } from "@puredit/parser";
import { Language } from "@puredit/language-config";

export const parser = await Parser.load(Language.TypeScript);
export const projectionPluginConfig: ProjectionPluginConfig = {
  parser,
  globalContextVariables,
  globalContextInformation,
  projections,
};
