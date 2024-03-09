import { parser } from "../parser";
import { svelteProjection } from "@puredit/projections/svelte";
import type { RootProjection } from "@puredit/projections/types";
import Widget from "./Widget.svelte";
import { integerPart } from "../common/integerPart/config";
import { arg, agg, contextVariable } from "@puredit/parser";
import EmptyWidget from "@puredit/projections/EmptyWidget.svelte";

const torch = contextVariable("torch");
const tensor = arg("tensor", ["identifier"]);
const shape = agg("shape", "tuple", [integerPart.pattern]);
const pattern = parser.statementPattern(
  "reshapeProjectionPattern"
)`${torch}.reshape(${tensor}, ${shape})`;

const widget = svelteProjection(Widget);
const emptyWidget = svelteProjection(EmptyWidget);

export const reshapeProjection: RootProjection = {
  name: "Reshape",
  description: "Reshape a tensor.",
  pattern,
  requiredContextVariables: ["torch"],
  segmentWidgets: [widget, emptyWidget],
  subProjections: [integerPart],
};
