import type { ProjectionPackageConfig } from "../../types";
import { compileMathProjection } from "./compileMathProjection";
import { evaluateMathProjection } from "./evaluateMathProjection";

export const latexMath: ProjectionPackageConfig = {
  name: "LaTeX Math",
  description: "Projections for mathematical formulas",
  projections: [compileMathProjection, evaluateMathProjection],
};
