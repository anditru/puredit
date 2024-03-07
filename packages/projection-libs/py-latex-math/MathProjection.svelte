<script lang="ts">
  import type { EditorState } from "@codemirror/state";
  import type { EditorView } from "@codemirror/view";
  import type { Match } from "@puredit/parser";
  import type { FocusGroup } from "@puredit/projections/focus";
  import { onMount } from "svelte";
  import EquationEditor from "./EquationEditor.svelte";
  import { ContextInformation } from "@puredit/projections";

  export let isNew: boolean;
  export let view: EditorView | null;
  export let match: Match;
  // svelte-ignore unused-export-let
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

<EquationEditor node={match.argsToAstNodeMap.latex} {state} {view} {focusGroup} />
