import { svelteProjection } from "@puredit/projections";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";
import { arg } from "@puredit/parser";

const dataType = arg("dataType", ["identifier"]);
const template = parser.subPattern("Polars:Column:Cast")`cast(pl.${dataType})`;

const widget = svelteProjection(Widget);

export const castSubProjection: SubProjection = {
  template,
  description: "Cast data to a certain datatype.",
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
