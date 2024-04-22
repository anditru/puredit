import { defaultKeymap } from "@codemirror/commands";
import {
  lineNumbers,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  rectangularSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
} from "@codemirror/view";
import { foldGutter, indentOnInput, bracketMatching } from "@codemirror/language";
import { closeBrackets, autocompletion } from "@codemirror/autocomplete";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import type { Extension } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { projectionPlugin, completions, type ProjectionPluginConfig } from "@puredit/projections";
import { oneDark } from "@codemirror/theme-one-dark";
import {
  typescript,
  completionSource as typescriptCompletionSource,
} from "@puredit/codemirror-typescript";
import { indentationMarkers } from "@replit/codemirror-indentation-markers";
import ProjectionalEditor from "./projectionalEditor";

export default class ProjectionalEditorBuilder {
  private extenstions: Extension[] = [];
  private parent: Element | DocumentFragment;

  constructor() {
    this.addBasicExtensions()
      .addOpticalExtensions()
      .addExtensions(
        typescript({ disableCompletions: true, disableTooltips: true }),
        autocompletion({
          activateOnTyping: true,
          override: [completions, typescriptCompletionSource],
        })
      );
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
      keymap.of([indentWithTab, ...searchKeymap, ...defaultKeymap])
    );
    return this;
  }

  private addOpticalExtensions(): ProjectionalEditorBuilder {
    this.addExtensions(
      oneDark,
      indentationMarkers(),
      EditorView.theme({
        ".cm-scroller": {
          fontFamily: "var(--mono-font, monospace)",
          fontSize: "14px",
        },
        ".cm-tooltip": {
          fontFamily: "var(--system-font, sans-serif)",
        },
      })
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

  build(): ProjectionalEditor {
    return new ProjectionalEditor(this.extenstions, this.parent);
  }
}
