<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { projectionPluginConfig } from "./projections";
  import { ProjectionalEditor, ProjectionalEditorBuilder } from "@puredit/editor-utils";

  let container: HTMLDivElement;
  let projectionalEditor: ProjectionalEditor | undefined;

  onMount(() => {
    const projectionalEditorBuilder = new ProjectionalEditorBuilder();
    projectionalEditor = projectionalEditorBuilder
      .configureProjectionPlugin(projectionPluginConfig)
      .setParent(container)
      .build();

    projectionalEditor.initialize();
  });

  onDestroy(() => {
    projectionalEditor?.destroy();
  });
</script>

<svelte:window on:message={projectionalEditor.handleMessage.bind(projectionalEditor)} />
<div class="container" bind:this={container} />

<style>
  .container {
    width: 100%;
    height: 100%;
  }
</style>
