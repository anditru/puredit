import type { ProjectionPluginConfig } from "@puredit/projections";
import { globalContextValues, globalContextVariables } from "@puredit/ts-db-sample/context";
import { Parser } from "@puredit/parser";
import { Language } from "@puredit/language-config";
import { projections } from "@puredit/ts-db-sample";

export const parser = await Parser.load(Language.TypeScript);
export const projectionPluginConfig: ProjectionPluginConfig = {
  parser,
  globalContextVariables,
  globalContextValues,
  projections,
};
