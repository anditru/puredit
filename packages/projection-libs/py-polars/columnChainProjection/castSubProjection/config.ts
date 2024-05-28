import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";
import { arg } from "@puredit/parser";

const dataType = arg("dataType", ["identifier"]);
const pattern = parser.subPattern("castSubProjectionPattern")`cast(pl.${dataType})`;

const widget = svelteProjection(Widget);

export const castSubProjection: SubProjection = {
  name: "Polars:Column:Cast",
  description: "Cast data to a certain datatype.",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
