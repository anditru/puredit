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

<span class="inline-flex">
  <span>Read column(s)</span>
  <TextInput
    className={highlightingFor(state, [tags.string])}
    node={match.args.var2}
    placeholder="var2"
    {state}
    {view}
    {focusGroup}
  />
  <span>from</span>
  <TextInput
    className={highlightingFor(state, [tags.string])}
    node={match.args.var1}
    placeholder="var1"
    {state}
    {view}
    {focusGroup}
  />
  <span>into</span>
  <TextInput
    className={highlightingFor(state, [tags.string])}
    node={match.args.var0}
    placeholder="var0"
    {state}
    {view}
    {focusGroup}
  />
</span>
