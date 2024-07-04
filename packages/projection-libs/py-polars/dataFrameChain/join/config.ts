import { svelteProjection } from "@puredit/projections";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";
import { arg } from "@puredit/parser";

const otherDataframe = arg("otherDataframe", ["identifier"]);
const onCondition = arg("onCondition", ["string"]);
const strategy = arg("strategy", ["string"]);

const template = parser.subPattern(
  "Polars:Dataframe:Join"
)`join(${otherDataframe}, on=${onCondition}, how=${strategy})`;

const widget = svelteProjection(Widget);

export const joinSubProjection: SubProjection = {
  template,
  description: "Join another dataframe.",
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
