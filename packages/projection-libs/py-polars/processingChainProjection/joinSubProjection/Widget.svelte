<script lang="ts">
  import { onMount } from "svelte";
  import type { EditorState } from "@codemirror/state";
  import type { EditorView } from "@codemirror/view";
  import type { Match } from "@puredit/parser";
  import type { FocusGroup } from "@puredit/projections/focus";
  import { ContextInformation } from "@puredit/projections";
  import TextInput from "@puredit/projections/TextInput.svelte";
  import { highlightingFor } from "@codemirror/language";
  import { tags } from "@lezer/highlight";
  import { validateFromList } from "@puredit/projections/shared";

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
  const joinStrategies = ["inner", "left", "outer", "semi", "anti", "cross", "outer_coalesce"];

  onMount(() => {
    if (isNew) {
      requestAnimationFrame(() => {
        focusGroup.first();
      });
    }
  });
</script>

<span class="inline-flex">
  <span>joining dataframe</span>
  <TextInput
    className={highlightingFor(state, [tags.atom])}
    node={match.argsToAstNodeMap.otherDataframe}
    {state}
    {view}
    {focusGroup}
    placeholder="dataframe"
  />
  on
  <TextInput
    className={highlightingFor(state, [tags.atom])}
    node={match.argsToAstNodeMap.onCondition}
    {state}
    {view}
    {focusGroup}
    placeholder="on"
  />
  with strategy
  <TextInput
    className={highlightingFor(state, [tags.atom])}
    node={match.argsToAstNodeMap.strategy}
    {state}
    {view}
    {focusGroup}
    completions={joinStrategies}
    validate={validateFromList(joinStrategies)}
    placeholder="strategy"
  />
</span>
