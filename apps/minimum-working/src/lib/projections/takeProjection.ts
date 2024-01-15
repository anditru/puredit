import { arg } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections/svelte";
import type { Projection } from "@puredit/projections/types";
import { pythonParser } from "./parser";
import TakeProjection from "./TakeProjection.svelte";

export const pattern = pythonParser.statementPattern`
${arg("var0", ["pattern_list"])} = ${arg("var1", ["identifier"])}.take(${arg(
  "var2",
  ["string"]
)}, ${arg("var3", ["string", "integer"])})
`;

export const widget = svelteProjection(TakeProjection);

export const takeProjection: Projection = {
  name: "take",
  description: "take",
  pattern,
  requiredContextVariables: [],
  widgets: [widget],
};
