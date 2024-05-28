import { parser } from "../parser";
import { svelteProjection } from "@puredit/projections/svelte";
import type { ContextInformation, RootProjection } from "@puredit/projections/types";
import Widget from "./Widget.svelte";
import { Match, arg } from "@puredit/parser";

const tensor = arg("tensor", ["identifier"]);
const dim0 = arg("dim0", ["integer"]);
const dim1 = arg("dim1", ["integer"]);

const pattern = parser.statementPattern(
  "transposeProjectionPattern"
)`${tensor}.transpose(${dim0}, ${dim1})`;

const widget = svelteProjection(Widget);

export const transposeProjection: RootProjection = {
  name: "PyTorch:Tensor:Transpose",
  description: "Swap two dimensions of a tensor.",
  pattern,
  requiredContextVariables: [],
  segmentWidgets: [widget],
  subProjections: [],
  contextProvider(match: Match, _, contextInformation: ContextInformation): ContextInformation {
    const dim0 = parseInt(match.argsToAstNodeMap.dim0.text, 10);
    const dim1 = parseInt(match.argsToAstNodeMap.dim1.text, 10);
    if (
      contextInformation.commentContext &&
      !Number.isNaN(dim0) &&
      !Number.isNaN(dim1) &&
      dim0 < contextInformation.commentContext.length &&
      dim1 < contextInformation.commentContext.length
    ) {
      const dimensions = contextInformation.commentContext;
      const temp = dimensions[dim0];
      dimensions[dim0] = dimensions[dim1];
      dimensions[dim1] = temp;
      return {
        dimensions,
      };
    } else {
      return {
        dimensions: null,
      };
    }
  },
};
