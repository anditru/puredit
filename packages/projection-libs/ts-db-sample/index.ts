import { changeProjection } from "./changeProjection/main";
import { replaceProjection } from "./replaceProjection/main";
import { trimProjection } from "./trimProjection/main";
import { logProjection } from "./logProjection";

export const projections = [changeProjection, replaceProjection, trimProjection, logProjection];
export { changeProjection, replaceProjection, trimProjection, logProjection };
