import { arg } from "@puredit/parser";
import { svelteProjection } from "@puredit/projections/svelte";
import type { SubProjection } from "@puredit/projections/types";
import { pythonParser } from "../../parser";
import Widget from "./Widget.svelte";

const attributeName = arg("attributeName", ["identifier"]);
export const pattern = pythonParser.subPattern("attributePattern")`
${attributeName}
`;

const widget = svelteProjection(Widget);

export const attributeSubProjection: SubProjection = {
  name: "Attribute",
  description: "Take an attribute",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
