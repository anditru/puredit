<script lang="ts">
  import { onMount } from "svelte";
  import type { EditorState } from "@codemirror/state";
  import type { EditorView } from "@codemirror/view";
  import type { Match } from "@puredit/parser";
  import type { FocusGroup } from "@puredit/projections/focus";
  import TextInput from "@puredit/projections/TextInput.svelte";
  import { highlightingFor } from "@codemirror/language";
  import { tags } from "@lezer/highlight";
  import { ContextInformation } from "@puredit/projections";

  export let isNew: boolean;
  export let focusGroup: FocusGroup;
  export let state: EditorState;
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

<div style="display: flex; flex-direction: column;">
  <span class="inline-flex">
    <span>name the variable column</span>
    <TextInput
      className={highlightingFor(state, [tags.atom])}
      node={match.argsToAstNodeMap.variableColumnName}
      {state}
      {view}
      {focusGroup}
      placeholder="valiable column name"
    />
  </span>
  <span class="inline-flex">
    <span>name the value column</span>
    <TextInput
      className={highlightingFor(state, [tags.atom])}
      node={match.argsToAstNodeMap.valueColumnName}
      {state}
      {view}
      {focusGroup}
      placeholder="value column name"
    />
  </span>
  <span class="inline-flex">
    <span>into</span>
    <TextInput
      className={highlightingFor(state, [tags.atom])}
      node={match.argsToAstNodeMap.moltenDataFrame}
      {state}
      {view}
      {focusGroup}
      placeholder="target data frame"
    />
  </span>
</div>
