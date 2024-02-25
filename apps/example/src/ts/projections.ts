import type { ProjectionPluginConfig } from "@puredit/projections";
import {
  globalContextValues,
  globalContextVariables,
} from "@puredit/projection-lib/ts/tsDbSample/context";
import { Parser } from "@puredit/parser";
import { Language } from "@puredit/language-config";
import { loadProjectionPackages } from "@puredit/projection-lib";

export const parser = await Parser.load(Language.TypeScript);
export const projectionPluginConfig: ProjectionPluginConfig = {
  parser,
  globalContextVariables,
  globalContextValues,
  ...loadProjectionPackages(Language.TypeScript, "tsDbSample"),
};
