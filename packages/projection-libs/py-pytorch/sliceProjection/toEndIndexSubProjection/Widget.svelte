<script lang="ts">
  import { beforeUpdate, onMount } from "svelte";
  import type { EditorState } from "@codemirror/state";
  import type { EditorView } from "@codemirror/view";
  import type { Match } from "@puredit/parser";
  import type { FocusGroup } from "@puredit/projections/focus";
  import { ContextInformation } from "@puredit/projections";

  import TextInput from "@puredit/projections/TextInput.svelte";
  import { highlightingFor } from "@codemirror/language";
  import { tags } from "@lezer/highlight";

  export let isNew: boolean;
  export let focusGroup: FocusGroup;
  export let state: EditorState;
  export let view: EditorView | null;
  export let match: Match;
  export let context: ContextInformation;
  let dimension: string | undefined;

  function updateDimension() {
    const dimensionIndex = context.sliceMatches.findIndex(
      (sliceMatch: Match) => sliceMatch === match
    );
    if (context.commentContext) {
      dimension = Object.keys(context.commentContext)[dimensionIndex];
    } else {
      dimension = undefined;
    }
  }
  updateDimension();

  onMount(() => {
    if (isNew) {
      requestAnimationFrame(() => {
        focusGroup.first();
      });
    }
  });

  beforeUpdate(() => {
    updateDimension();
  });
</script>

<span class="inline-flex">
  {#if dimension}
    <span>Dimension {dimension} up to index</span>
  {:else}
    <span>Select up to index</span>
  {/if}
  <TextInput
    className={highlightingFor(state, [tags.atom])}
    node={match.argsToAstNodeMap.endIndex}
    {state}
    {view}
    {focusGroup}
    placeholder="end index"
  />
  <span>with stepsize</span>
  <TextInput
    className={highlightingFor(state, [tags.atom])}
    node={match.argsToAstNodeMap.stepSize}
    {state}
    {view}
    {focusGroup}
    placeholder="step size"
  />
</span>
