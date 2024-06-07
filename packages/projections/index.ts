import {
  createProjectionState,
  projectionState,
  insertDeclarativeProjectionsEffect,
  removeProjectionPackagesEffect,
} from "./state/state";
import { transactionFilter } from "./filter";
import { completions } from "./completions/completions";
import type {
  ProjectionPluginConfig,
  SubProjection,
  RootProjection,
  ContextVariableMap,
  ContextInformation,
} from "./types";
import { style } from "./widget/style";

export type {
  ProjectionPluginConfig,
  SubProjection,
  RootProjection,
  ContextVariableMap,
  ContextInformation,
};

export const projectionPlugin = (config: ProjectionPluginConfig) => [
  style,
  projectionState.init((state) => createProjectionState(state, config)),
  transactionFilter,
];

export { completions, insertDeclarativeProjectionsEffect, removeProjectionPackagesEffect };

export { default as ProjectionRegistry } from "./projectionRegistry";
export { default as Projection } from "./projection";
export { FocusGroup } from "./widget/focus";
export { svelteProjection } from "./widget/svelte";
export { simpleProjection } from "./widget/simpleWidget";
