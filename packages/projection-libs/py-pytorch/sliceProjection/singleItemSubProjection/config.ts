import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";
import { arg } from "@puredit/parser";

const index = arg("index", ["integer", "identifier"]);
const pattern = parser.subPattern("singleItemSubProjectionPattern")`${index}`;

const widget = svelteProjection(Widget);

export const singleItemSubProjection: SubProjection = {
  name: "Select single Item",
  description: "Select a single item.",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
