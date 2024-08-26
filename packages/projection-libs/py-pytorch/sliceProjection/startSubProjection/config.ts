import { arg } from "@puredit/parser";
import { simpleProjection, SubProjection } from "@puredit/projections";
import { parser } from "../../parser";

const tensorName = arg("tensorName", ["identifier"]);
const template = parser.subPattern("PyTorch:Tensor:Slice:Base")`${tensorName}`;
const widget = simpleProjection(["Slice tensor", tensorName]);

export const startSubProjection: SubProjection = {
  template,
  description: "Base tensor to slice.",
  requiredContextVariables: [],
  segmentWidgets: [widget],
};
