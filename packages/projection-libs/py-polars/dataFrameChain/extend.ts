import { parser } from "../parser";
import { simpleProjection, SubProjection } from "@puredit/projections";
import { agg, reference } from "@puredit/parser";
import { binColumnCompositionSubProjection } from "./binColumnComposition";

const columnCombinations = agg("columnCombinations", "argument_list", [
  binColumnCompositionSubProjection.template,
  reference("Polars:Column:Chain"),
]);
const template = parser.subPattern("Polars:Dataframe:Extend")`with_columns${columnCombinations}`;
const beginWidget = simpleProjection(["extending dataframe with column(s)"]);
const endWidget = simpleProjection(["end columns"]);

export const extendSubProjection: SubProjection = {
  description: "Extend a dataframe with a set of columns.",
  template,
  requiredContextVariables: [],
  segmentWidgets: [beginWidget, endWidget],
};
