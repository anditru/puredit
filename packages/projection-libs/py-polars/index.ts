import { columnChainProjection } from "./columnChainProjection/main";
import { selectChainProjection as processingChainProjection } from "./processingChainProjection/main";
import { extendDataFrameProjection } from "./extendDataFrameProjection/main";
import { pivotProjection } from "./pivotProjection/main";
import { meltProjection } from "./meltProjection/main";

export const projections = [
  columnChainProjection,
  processingChainProjection,
  extendDataFrameProjection,
  pivotProjection,
  meltProjection,
];
export {
  columnChainProjection,
  processingChainProjection,
  extendDataFrameProjection,
  pivotProjection,
  meltProjection,
};
