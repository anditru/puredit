import { arg } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";

const condition = arg("condition", ["comparison_operator"]);
export const template = parser.subPattern("Polars:Dataframe:Filter")`filter(${condition})`;

const widget = svelteProjection(Widget);

export const filterSubProjection: SubProjection = {
  template,
  description: "Filter the rows of a dataframe.",
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
