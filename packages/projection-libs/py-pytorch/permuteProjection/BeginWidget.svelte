<script lang="ts">
  import { onMount } from "svelte";
  import type { EditorState } from "@codemirror/state";
  import type { EditorView } from "@codemirror/view";
  import type { Match } from "@puredit/parser";
  import type { FocusGroup } from "@puredit/projections";
  import { ContextInformation } from "@puredit/projections";

  import TextInput from "@puredit/projections/controls/TextInput.svelte";
  import { tags } from "@lezer/highlight";
  import { highlightingFor } from "@codemirror/language";

  export let isNew: boolean;
  export let focusGroup: FocusGroup;
  // svelte-ignore unused-export-let
  export let state: EditorState;
  // svelte-ignore unused-export-let
  export let view: EditorView | null;
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

<span class="inline-flex">
  <div style="display: flex; flex-direction: column;">
    <span class="inline-flex">
      <span>Permute dimensions of tensor</span>
      <TextInput
        className={highlightingFor(state, [tags.atom])}
        node={match.argsToAstNodeMap.tensor}
        {state}
        {view}
        {focusGroup}
        placeholder="tensor"
      />
      <span>to order</span>
    </span>
    <div class="preview-container">
      {#if context.reorderedDimensions}
        <span>Dimensions after permutation:</span>
        <div style="display: flex; flex-direction: column;">
          {#each context.reorderedDimensions as dimension, index}
            <span style="margin-left: 10px;">{index}: {dimension}</span>
          {/each}
        </div>
      {:else}
        <span>Add tensors's dimensions as context comment to<br />see the preview</span>
      {/if}
    </div>
  </div>
</span>

<style>
  .preview-container {
    display: flex;
    flex-direction: column;
    padding: 5px;
    margin-bottom: 10px;
    color: white;
    border-style: solid;
    border-width: 1px;
    border-radius: 10px;
    border-color: white;
  }
</style>
