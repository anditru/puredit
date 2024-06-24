<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { projectionPluginConfig } from "./projections";
  import { ProjectionalEditor, ProjectionalEditorBuilder } from "@puredit/editor-utils";
  import { VsCodeMessenger } from "@puredit/editor-utils";
  import { python, globalCompletion, localCompletionSource } from "@codemirror/lang-python";
  import { autocompletion } from "@codemirror/autocomplete";
  import { completions } from "@puredit/projections";
  import { indentUnit } from "@codemirror/language";

  let container: HTMLDivElement;
  let projectionalEditor: ProjectionalEditor | undefined;

  onMount(async () => {
    const projectionalEditorBuilder = new ProjectionalEditorBuilder();
    projectionalEditor = projectionalEditorBuilder
      .configureProjectionPlugin(projectionPluginConfig)
      .addExtensions(
        python(),
        indentUnit.of("    "),
        autocompletion({
          activateOnTyping: true,
          override: [completions, globalCompletion, localCompletionSource],
        })
      )
      .setParent(container)
      .setVsCodeMessenger(VsCodeMessenger.getInstance())
      .build();

    await projectionalEditor.initialize();
  });

  onDestroy(() => {
    projectionalEditor?.destroy();
  });
</script>

<div class="container" bind:this={container} />

<style>
  .container {
    width: 100%;
    height: 100%;
  }
</style>
