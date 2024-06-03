import { arg, contextVariable } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections";
import type { RootProjection } from "@puredit/projections/types";
import MathProjection from "./MathProjection.svelte";
import { parser } from "./parser";

const dsl = contextVariable("mathdsl");
const latex = arg("latex", ["string"]);
const pattern = parser.expressionPattern("Math:Evaluate")`${dsl}.evaluate(${latex}, locals())`;

const widget = svelteProjection(MathProjection);

export const evaluateMathProjection: RootProjection = {
  pattern,
  description:
    "Evaluates an expression in mathematical notation using the variables from the current local scope.",
  requiredContextVariables: [],
  segmentWidgets: [widget],
  subProjections: [],
};
