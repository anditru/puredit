import { columnChainProjection } from "./columnChainProjection/main";
import { selectChainProjection } from "./selectChainProjection/main";
import { extendDataFrameProjection } from "./extendDataFrameProjection/main";
import { pivotProjection } from "./pivotProjection/main";

export const projections = [
  columnChainProjection,
  selectChainProjection,
  extendDataFrameProjection,
  pivotProjection,
];
export { columnChainProjection, selectChainProjection, extendDataFrameProjection, pivotProjection };
