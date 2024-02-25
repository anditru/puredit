<script lang="ts">
  import { onMount } from "svelte";
  import type { FocusGroup } from "@puredit/projections/focus";
  import type { EditorView } from "codemirror";
  import type { Context, Match } from "@puredit/parser";
  import type { EditorState } from "@codemirror/state";

  //svelte-ignore unused-export-let
  export let isNew: boolean;
  //svelte-ignore unused-export-let
  export let view: EditorView | null;
  //svelte-ignore unused-export-let
  export let match: Match;
  //svelte-ignore unused-export-let
  export let context: Context;
  //svelte-ignore unused-export-let
  export let state: EditorState;
  //svelte-ignore unused-export-let
  export let focusGroup: FocusGroup;

  onMount(() => {
    if (isNew) {
      requestAnimationFrame(() => {
        focusGroup.first();
      });
    }
  });
</script>

<span class="inline-flex" />
