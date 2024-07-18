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
import { highlightSelectionMatches } from "@codemirror/search";
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

  constructor() {
    this.addBasicExtensions().addOpticalExtensions();
  }

  private addBasicExtensions(): ProjectionalEditorBuilder {
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
      keymap.of([indentWithTab, ...defaultKeymap])
    );
    return this;
  }

  private addOpticalExtensions(): ProjectionalEditorBuilder {
    this.addExtensions(
      vscodeDarkInit({
        settings: {
          fontSize: 30,
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

  build(): ProjectionalEditor {
    return new ProjectionalEditor(this.vsCodeMessenger, this.extenstions, this.parent);
  }
}
