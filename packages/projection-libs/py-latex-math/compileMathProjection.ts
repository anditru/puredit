import { arg, contextVariable } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections";
import type { RootProjection } from "@puredit/projections/types";
import MathProjection from "./MathProjection.svelte";
import { parser } from "./parser";

const dsl = contextVariable("mathdsl");
const latex = arg("latex", ["string"]);
const pattern = parser.expressionPattern("Math:Compile")`${dsl}.compile(${latex})`;

const widget = svelteProjection(MathProjection);

export const compileMathProjection: RootProjection = {
  pattern,
  description:
    "Transforms an expression in mathematical notation into a reusable functions, using free symbols as named parameters.",
  requiredContextVariables: [],
  segmentWidgets: [widget],
  subProjections: [],
};
