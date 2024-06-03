<script lang="ts">
  import { onMount } from "svelte";
  import { tags } from "@lezer/highlight";
  import type { EditorState } from "@codemirror/state";
  import type { EditorView } from "@codemirror/view";
  import { highlightingFor } from "@codemirror/language";
  import type { Match } from "@puredit/parser";
  import type { FocusGroup } from "@puredit/projections";
  import TextInput from "@puredit/projections/controls/TextInput.svelte";
  import { validateFromList } from "@puredit/projections/shared";
  import type { ContextTable } from "../context";

  export let isNew: boolean;
  export let view: EditorView | null;
  export let match: Match;
  export let context: ContextTable;
  export let state: EditorState;
  export let focusGroup: FocusGroup;

  let textColumns: string[];
  $: textColumns = Object.keys(context.columns).filter((key) => context.columns[key] === "TEXT");

  onMount(() => {
    if (isNew) {
      requestAnimationFrame(() => {
        focusGroup.first();
      });
    }
  });
</script>

<span class="inline-flex">
  <span>replace</span>
  <TextInput
    className={highlightingFor(state, [tags.string])}
    node={match.argsToAstNodeMap.target}
    {state}
    {view}
    {focusGroup}
    placeholder="target"
  />
  <span>in column</span>
  <TextInput
    className={highlightingFor(state, [tags.atom])}
    node={match.argsToAstNodeMap.column}
    {state}
    {view}
    {focusGroup}
    placeholder="column"
    completions={textColumns}
    validate={validateFromList(textColumns)}
  />
  <span>with</span>
  <TextInput
    className={highlightingFor(state, [tags.string])}
    node={match.argsToAstNodeMap.replacement}
    {state}
    {view}
    {focusGroup}
    placeholder="replacement"
  />
</span>
