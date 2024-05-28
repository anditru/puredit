import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";
import { arg } from "@puredit/parser";

const otherDataframe = arg("otherDataframe", ["identifier"]);
const onCondition = arg("onCondition", ["string", "attribute"]);
const strategy = arg("strategy", ["string"]);
const pattern = parser.subPattern(
  "joinSubProjectionPattern"
)`join(${otherDataframe}, on=${onCondition}, how=${strategy})`;

const widget = svelteProjection(Widget);

export const joinSubProjection: SubProjection = {
  name: "Polars:Dataframe:Join",
  description: "Join another dataframe.",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
