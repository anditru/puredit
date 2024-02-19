<script lang="ts">
  import { onMount } from "svelte";
  import type { FocusGroup } from "@puredit/projections/focus";

  export let isNew: boolean;
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
