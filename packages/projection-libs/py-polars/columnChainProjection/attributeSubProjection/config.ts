import { arg } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { parser } from "../../parser";
import Widget from "./Widget.svelte";

const attributeName = arg("attributeName", ["identifier"]);
const pattern = parser.subPattern("attributePattern")`${attributeName}`;

const widget = svelteProjection(Widget);

export const attributeSubProjection: SubProjection = {
  name: "Attribute",
  description: "Take an attribute",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
