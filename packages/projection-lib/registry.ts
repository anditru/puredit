import { Language } from "@puredit/language-config";
import type { ProjectionPackageRegistry } from "./types";

import { pyDbSample } from "./py/pyDbSample";
import { latexMath } from "./py/latexMath";
import { polars } from "./py/polars";

import { tsDbSample } from "./ts/tsDbSample";

export const projectionPackageRegistry: ProjectionPackageRegistry = {
  [Language.Python]: {
    polars,
    latexMath,
    pyDbSample,
  },
  [Language.TypeScript]: {
    tsDbSample,
  },
};
