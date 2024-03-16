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

  export let isNew: boolean;
  export let focusGroup: FocusGroup;
  export let state: EditorState;
  export let view: EditorView | null;
  export let match: Match;
  export let context: ContextInformation;

  const dimensionIndex = context.sliceMatches.findIndex(
    (sliceMatch: Match) => sliceMatch === match
  );
  let dimension: string = Object.keys(context.commentContext)[dimensionIndex];

  onMount(() => {
    if (isNew) {
      requestAnimationFrame(() => {
        focusGroup.first();
      });
    }
  });
</script>

<span class="inline-flex">
  <span>Dimension {dimension} item at index</span>
  <TextInput
    className={highlightingFor(state, [tags.atom])}
    node={match.argsToAstNodeMap.index}
    {state}
    {view}
    {focusGroup}
    placeholder="index"
  />
</span>
