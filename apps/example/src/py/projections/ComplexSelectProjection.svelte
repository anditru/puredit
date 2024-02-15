<script lang="ts">
  import { onMount } from "svelte";
  import { tags } from "@lezer/highlight";
  import type { EditorState } from "@codemirror/state";
  import type { EditorView } from "@codemirror/view";
  import { highlightingFor } from "@codemirror/language";
  import type { Match } from "@puredit/parser";
  import type { FocusGroup } from "@puredit/projections/focus";
  import TextInput from "@puredit/projections/TextInput.svelte";

  export let isNew: boolean;
  export let view: EditorView | null;
  export let match: Match;
  //svelte-ignore unused-export-let
  export let context: any;
  export let state: EditorState;
  export let focusGroup: FocusGroup;

  onMount(() => {
    if (isNew) {
      requestAnimationFrame(() => {
        focusGroup.first();
      });
    }
  });
</script>

<div style="display: flex; flex-direction: column">
  <span>Read column(s)</span>
  {#each match.aggregationToSubMatchesMap["columns"] as columnMatch}
    {#if columnMatch.pattern.name === "column"}
      <span id="column" class="inline-flex">
        <TextInput
          className={highlightingFor(state, [tags.string])}
          node={columnMatch.argsToAstNodeMap.columnName}
          placeholder="columnName"
          {state}
          {view}
          {focusGroup}
        />
      </span>
    {:else if columnMatch.pattern.name === "columnWithAlias"}
      <span id="columnWithAlias" class="inline-flex">
        <TextInput
          className={highlightingFor(state, [tags.string])}
          node={columnMatch.argsToAstNodeMap.columnName}
          placeholder="columnName"
          {state}
          {view}
          {focusGroup}
        />
        <span>as</span>
        <TextInput
          className={highlightingFor(state, [tags.string])}
          node={columnMatch.argsToAstNodeMap.columnAlias}
          placeholder="columnAlias"
          {state}
          {view}
          {focusGroup}
        />
      </span>
    {:else if columnMatch.pattern.name === "default"}
      <span id="column" class="inline-flex" style="margin: 0 10px">
        {columnMatch.argsToAstNodeMap.content.text}
      </span>
    {/if}
  {/each}

  <span id="fromClause" class="inline-flex">
    <span>from</span>
    <TextInput
      className={highlightingFor(state, [tags.string])}
      node={match.argsToAstNodeMap.sourceDataFrame}
      placeholder="sourceDataFrame"
      {state}
      {view}
      {focusGroup}
    />
  </span>

  <span id="intoClause" class="inline-flex">
    <span>into</span>
    <TextInput
      className={highlightingFor(state, [tags.string])}
      node={match.argsToAstNodeMap.targetDataFrame}
      placeholder="targetDataFrame"
      {state}
      {view}
      {focusGroup}
    />
  </span>
</div>
