import type { ProjectionPackageConfig } from "../../types";
import { columnChainProjection } from "./columnChainProjection/main";
import { selectChainProjection } from "./selectChainProjection/main";

export const polars: ProjectionPackageConfig = {
  name: "Polars",
  description: "Projections for the Python library Polars",
  projections: [columnChainProjection, selectChainProjection],
};
