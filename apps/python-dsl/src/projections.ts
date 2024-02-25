import type { ProjectionPluginConfig } from "@puredit/projections";
import {
  globalContextValues,
  globalContextVariables,
} from "@puredit/projection-lib/py/pyDbSample/context";
import { Language } from "@puredit/language-config";
import { Parser } from "@puredit/parser";
import { loadProjectionPackages } from "@puredit/projection-lib";

export const parser = await Parser.load(Language.Python);
export const projectionPluginConfig: ProjectionPluginConfig = {
  parser,
  globalContextVariables,
  globalContextValues,
  ...loadProjectionPackages(Language.Python, "pyDbSample"),
};
