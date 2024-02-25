import type { ProjectionPackageConfig } from "../../types";
import { changeProjection } from "./changeProjection/main";
import { replaceProjection } from "./replaceProjection/main";
import { trimProjection } from "./trimProjection/main";
import { logProjection } from "./logProjection";

export const tsDbSample: ProjectionPackageConfig = {
  name: "TypeScript DB Sample",
  description: "Projections for the DB sample for TypeScript",
  projections: [changeProjection, replaceProjection, trimProjection, logProjection],
};
