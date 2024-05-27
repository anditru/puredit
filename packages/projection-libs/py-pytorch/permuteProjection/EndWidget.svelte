<script lang="ts">
  import { onMount } from "svelte";
  import type { EditorState } from "@codemirror/state";
  import type { EditorView } from "@codemirror/view";
  import type { Match } from "@puredit/parser";
  import type { FocusGroup } from "@puredit/projections/focus";
  import { ContextInformation } from "@puredit/projections";

  export let isNew: boolean;
  export let focusGroup: FocusGroup;
  // svelte-ignore unused-export-let
  export let state: EditorState;
  // svelte-ignore unused-export-let
  export let view: EditorView | null;
  // svelte-ignore unused-export-let
  export let match: Match;
  // svelte-ignore unused-export-let
  export let context: ContextInformation;

  onMount(() => {
    if (isNew) {
      requestAnimationFrame(() => {
        focusGroup.first();
      });
    }
  });
</script>

<div style="display: flex; flex-direction: column;">
  {#if context.reorderedDimensions}
    <span>Dimensions after permutation:</span>
    <div style="display: flex; flex-direction: column;">
      {#each context.reorderedDimensions as dimension, index}
        <span style="margin-left: 10px;">{index}: {dimension}</span>
      {/each}
    </div>
  {/if}
</div>
