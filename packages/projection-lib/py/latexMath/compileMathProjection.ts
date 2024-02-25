import { arg, contextVariable } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections/svelte";
import type { RootProjection } from "@puredit/projections/types";
import MathProjection from "./MathProjection.svelte";
import { parser } from "../parser";

const dsl = contextVariable("mathdsl");
const latex = arg("latex", ["string"]);

const pattern = parser.expressionPattern("compileMath")`${dsl}.compile(${latex})`;

const widget = svelteProjection(MathProjection);

export const compileMathProjection: RootProjection = {
  name: "compile math",
  description:
    "Transforms an expression in mathematical notation into a reusable functions, using free symbols as named parameters.",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
