import { columnChainProjection } from "./columnChainProjection/main";
import { selectChainProjection as processingChainProjection } from "./processingChainProjection/main";

export const projections = [columnChainProjection, processingChainProjection];
export { columnChainProjection, processingChainProjection };
