import { arg, contextVariable } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections/svelte";
import type { RootProjection } from "@puredit/projections/types";
import MathProjection from "./MathProjection.svelte";
import { pythonParser } from "./parser";

const dsl = contextVariable("mathdsl");
const latex = arg("latex", ["string"]);

export const pattern = pythonParser.expressionPattern("compileMath")`${dsl}.compile(${latex})`;

export const widget = svelteProjection(MathProjection);

export const compileMathProjection: RootProjection = {
  name: "compile math",
  description:
    "Transforms an expression in mathematical notation into a reusable functions, using free symbols as named parameters.",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
