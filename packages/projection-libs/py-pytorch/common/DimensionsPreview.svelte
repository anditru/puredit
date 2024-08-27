<script lang="ts">
  import type { EditorState } from "@codemirror/state";
  import { Match } from "@puredit/parser";
  import { beforeUpdate } from "svelte";

  export let state: EditorState;
  export let match: Match;
  export let dimensions: string[];

  let showPreview = false;
  let previewBelow = showPreviewBelow();

  beforeUpdate(() => {
    previewBelow = showPreviewBelow();
  });

  function showPreviewBelow() {
    const line = state.doc.lineAt(match.from);
    const boundry = dimensions ? dimensions.length + 3 : 4;
    return boundry > line.number;
  }
</script>

<div class="preview-container">
  <button class="preview-button" on:click={() => (showPreview = !showPreview)}> &#x1F4A1; </button>
  {#if showPreview}
    <div
      class="preview-box cm-tooltip"
      class:preview-above={!previewBelow}
      class:preview-below={previewBelow}
    >
      {#if dimensions}
        <span>Dimensions after operation:</span>
        <div style="display: flex; flex-direction: column;">
          {#each dimensions as dimension, index}
            <span style="margin-left: 10px;">{index}: {dimension}</span>
          {/each}
        </div>
      {:else}
        <!-- prettier-ignore -->
        <span>You need to provide tensors's dimensions in a context<br />comment fitting to the code to see the preview.</span>
      {/if}
    </div>
  {/if}
</div>

<style>
  .preview-container {
    position: relative;
  }

  .preview-button {
    margin-left: 10px;
    border-style: solid;
    border-width: 1px;
    border-radius: 5px;
    padding: 4px;
    border-color: white;
    background-color: #1e1e1e;
  }

  .preview-box {
    position: absolute;
    top: 0;
    left: 0;
    margin-top: 1em;
    padding: 5px;
    margin-bottom: 10px;
    color: white;
    border-style: solid;
    border-width: 1px;
    border-radius: 10px;
    border-color: white;
    background-color: #1e1e1e;
  }

  .preview-above {
    transform: translateY(calc(-100% - 20px)) translateX(9px);
  }

  .preview-below {
    transform: translateY(20px) translateX(9px);
  }
</style>
