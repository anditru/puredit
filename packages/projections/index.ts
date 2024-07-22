import {
  createProjectionState,
  projectionState,
  insertDeclarativeProjectionsEffect,
  removeProjectionPackagesEffect,
  scrollListener,
} from "./state/stateField";
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
import { cursorRescuer } from "./cursorMovements";
import { debouncedTypeListener } from "./state/debouncing";

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
  scrollListener,
  debouncedTypeListener,
  cursorRescuer,
];

export { completions, insertDeclarativeProjectionsEffect, removeProjectionPackagesEffect };

export { default as ProjectionRegistry } from "./state/projectionRegistry";
export { default as Projection } from "./state/projection";
export { FocusGroup, type CursorPositionHandler } from "./widget/focus";
export { svelteProjection } from "./widget/svelte";
export { staticWidget } from "./widget/staticWidget";
export { simpleProjection } from "./widget/simpleWidget";
