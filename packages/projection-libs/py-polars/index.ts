import { columnChainProjection } from "./columnChainProjection/main";
import { selectChainProjection } from "./selectChainProjection/main";
import { extendDataFrameProjection } from "./extendDataFrameProjection/main";

export const projections = [
  columnChainProjection,
  selectChainProjection,
  extendDataFrameProjection,
];
export { columnChainProjection, selectChainProjection, extendDataFrameProjection };
