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
    const platform = window.navigator?.userAgentData?.platform;
    if (!platform) {
      console.warn("Could not detect platform. Defaulting to non-Windows.");
    }
    const onWindows = ["Win32", "Win64", "Windows", "WinCE"].includes(platform);
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
      .setOnWindows(onWindows)
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
