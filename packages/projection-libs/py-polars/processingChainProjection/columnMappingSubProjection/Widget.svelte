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
  // svelte-ignore unused-export-let
  export let view: EditorView | null;
  // svelte-ignore unused-export-let
  export let match: Match;
  // svelte-ignore unused-export-let
  export let context: ContextInformation;
  // svelte-ignore unused-export-let
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

<span class="inline-flex">
  <TextInput
    className={highlightingFor(state, [tags.string])}
    node={match.argsToAstNodeMap.columnName}
    placeholder="columnName"
    {state}
    {view}
    {focusGroup}
  />
  <span>to</span>
  <TextInput
    className={highlightingFor(state, [tags.string])}
    node={match.argsToAstNodeMap.alias}
    placeholder="columnAlias"
    {state}
    {view}
    {focusGroup}
  />
</span>
