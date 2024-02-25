import type { ProjectionPackageConfig } from "../../types";
import { changeProjection } from "./changeProjection/main";
import { replaceProjection } from "./replaceProjection/main";
import { trimProjection } from "./trimProjection/main";

export const pyDbSample: ProjectionPackageConfig = {
  name: "Python DB Sample",
  description: "Projections for the DB sample for Python",
  projections: [changeProjection, replaceProjection, trimProjection],
};
