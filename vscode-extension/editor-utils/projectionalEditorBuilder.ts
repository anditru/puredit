import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import {
  lineNumbers,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  rectangularSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
} from "@codemirror/view";
import { foldGutter, indentOnInput, bracketMatching } from "@codemirror/language";
import { closeBrackets } from "@codemirror/autocomplete";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import type { Extension } from "@codemirror/state";
import { projectionPlugin, type ProjectionPluginConfig } from "@puredit/projections";
import { vscodeDarkInit } from "@uiw/codemirror-theme-vscode";
import { indentationMarkers } from "@replit/codemirror-indentation-markers";
import ProjectionalEditor from "./projectionalEditor";
import VsCodeMessenger from "./vsCodeMessenger";

export default class ProjectionalEditorBuilder {
  private extenstions: Extension[] = [];
  private parent!: Element | DocumentFragment;
  private vsCodeMessenger!: VsCodeMessenger;
  private onWindows!: boolean;

  constructor() {
    this.addBasicExtensions().addOpticalExtensions();
  }

  private addBasicExtensions(): ProjectionalEditorBuilder {
    const reducedKeymap = defaultKeymap.filter(
      (binding) => !binding.key || !["Alt-ArrowLeft", "Alt-ArrowRight"].includes(binding.key)
    );

    this.addExtensions(
      lineNumbers(),
      highlightSpecialChars(),
      drawSelection(),
      dropCursor(),
      rectangularSelection(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      foldGutter(),
      indentOnInput(),
      closeBrackets(),
      bracketMatching(),
      highlightSelectionMatches(),
      keymap.of([indentWithTab, ...searchKeymap, ...reducedKeymap])
    );
    return this;
  }

  private addOpticalExtensions(): ProjectionalEditorBuilder {
    this.addExtensions(
      vscodeDarkInit({
        settings: {
          fontSize: 25,
        },
      }),
      indentationMarkers()
    );
    return this;
  }

  configureProjectionPlugin(config: ProjectionPluginConfig): ProjectionalEditorBuilder {
    this.addExtensions(projectionPlugin(config));
    return this;
  }

  addExtensions(...extensions: Extension[]): ProjectionalEditorBuilder {
    this.extenstions.push(...extensions);
    return this;
  }

  setParent(parent: Element | DocumentFragment) {
    this.parent = parent;
    return this;
  }

  setVsCodeMessenger(vsCodeMessenger: VsCodeMessenger) {
    this.vsCodeMessenger = vsCodeMessenger;
    return this;
  }

  setOnWindows(onWindows: boolean) {
    this.onWindows = onWindows;
    return this;
  }

  build(): ProjectionalEditor {
    return new ProjectionalEditor(
      this.vsCodeMessenger,
      this.extenstions,
      this.parent,
      this.onWindows
    );
  }
}
