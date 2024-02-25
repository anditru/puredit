import { flexPlugin } from "./flex";
import { createProjectionState, projectionState } from "./state/state";
import { transactionFilter } from "./filter";
import { completions } from "./completions/completions";
import type { ProjectionPluginConfig, Projection, SubProjection, RootProjection } from "./types";
import { style } from "./style";

export type { ProjectionPluginConfig, Projection, SubProjection, RootProjection };

export const projectionPlugin = (config: ProjectionPluginConfig) => [
  style,
  projectionState.init((state) => createProjectionState(state, config)),
  transactionFilter,
  flexPlugin,
];

export { completions };
