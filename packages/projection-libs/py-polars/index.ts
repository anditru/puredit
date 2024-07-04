import { columnChainProjection } from "./columnChain/main";
import { dataFrameChainProjection } from "./dataFrameChain/main";

export const projections = [dataFrameChainProjection, columnChainProjection];
export { dataFrameChainProjection, columnChainProjection };
