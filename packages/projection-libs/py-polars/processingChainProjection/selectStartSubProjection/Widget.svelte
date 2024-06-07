<script lang="ts">
  import { onMount } from "svelte";
  import { tags } from "@lezer/highlight";
  import type { EditorState } from "@codemirror/state";
  import type { EditorView } from "@codemirror/view";
  import { highlightingFor } from "@codemirror/language";
  import type { Match } from "@puredit/parser";
  import type { FocusGroup } from "@puredit/projections";
  import TextInput from "@puredit/projections/controls/TextInput.svelte";
  import { ContextInformation } from "@puredit/projections";

  export let isNew: boolean;
  export let view: EditorView | null;
  export let match: Match;
  //svelte-ignore unused-export-let
  export let context: ContextInformation;
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
  <span>Dataframe</span>
  <TextInput
    className={highlightingFor(state, [tags.atom])}
    node={match.argsToAstNodeMap.sourceDataFrame}
    {state}
    {view}
    {focusGroup}
    placeholder="data frame"
  />
  <span>transformed by</span>
</span>
