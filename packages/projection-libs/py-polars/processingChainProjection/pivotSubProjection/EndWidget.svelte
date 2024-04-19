<script lang="ts">
  import { onMount } from "svelte";
  import type { EditorState } from "@codemirror/state";
  import type { EditorView } from "@codemirror/view";
  import type { Match } from "@puredit/parser";
  import type { FocusGroup } from "@puredit/projections/focus";
  import TextInput from "@puredit/projections/TextInput.svelte";
  import { highlightingFor } from "@codemirror/language";
  import { tags } from "@lezer/highlight";
  import { validateFromList } from "@puredit/projections/shared";
  import { ContextInformation } from "@puredit/projections";

  export let isNew: boolean;
  export let view: EditorView | null;
  export let match: Match;
  // svelte-ignore unused-export-let
  export let context: ContextInformation;
  export let state: EditorState;
  export let focusGroup: FocusGroup;

  const aggregationFunctions = ["min", "max", "first", "last", "sum", "mean", "median", "len"];

  onMount(() => {
    if (isNew) {
      requestAnimationFrame(() => {
        focusGroup.first();
      });
    }
  });
</script>

<span class="inline-flex">
  <span>using aggregation function</span>
  <TextInput
    className={highlightingFor(state, [tags.atom])}
    node={match.argsToAstNodeMap.aggFunction}
    {state}
    {view}
    {focusGroup}
    placeholder="aggregation function"
    completions={aggregationFunctions}
    validate={validateFromList(aggregationFunctions)}
  />
</span>
