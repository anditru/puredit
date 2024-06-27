import { tags } from "@lezer/highlight";
import { EditorSelection, EditorState } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { highlightingFor } from "@codemirror/language";
import type { Match } from "@puredit/parser";
import { FocusGroup } from "@puredit/projections";
import type { FocusGroupHandler } from "./focus";
import { ContextInformation } from "../types";
import { ProjectionWidget } from "./widget";
import TextInput from "@puredit/projections/controls/TextInput.svelte";
import { isString } from "@puredit/utils-shared";
import type { SvelteComponent } from "./svelte";
import type { TemplateArgument } from "@puredit/parser";

export const simpleProjection = (template: Array<string | TemplateArgument | TemplateArgument[]>) =>
  class extends ProjectionWidget implements FocusGroupHandler {
    focusGroup!: FocusGroup;
    inputs: Array<[TemplateArgument[], SvelteComponent<any>]>;

    protected initialize(
      match: Match,
      _context: ContextInformation,
      state: EditorState
    ): HTMLElement {
      this.focusGroup = new FocusGroup(this);
      this.inputs = [];
      const target = document.createElement("span");
      target.className = "inline-flex";
      for (const part of template) {
        if (isString(part)) {
          const element = document.createElement("span");
          target.appendChild(element);
          element.textContent = part;
        } else {
          const args = part instanceof Array ? part : [part];
          const component = new TextInput({
            target,
            props: {
              className: highlightingFor(state, [tags.string]),
              node: match.argsToAstNodeMap[args[0].name],
              targetNodes:
                args.length > 1 ? args.map((arg) => match.argsToAstNodeMap[arg.name]) : undefined,
              placeholder: args[0].name,
              state,
              view: null,
              focusGroup: this.focusGroup,
            },
          });
          this.inputs.push([args, component]);
        }
      }
      return target;
    }

    protected update(match: Match, context: ContextInformation, state: EditorState): void {
      for (const [args, component] of this.inputs) {
        component.$set({
          node: match.argsToAstNodeMap[args[0].name],
          targetNodes:
            args.length > 1 ? args.map((arg) => match.argsToAstNodeMap[arg.name]) : undefined,
          context,
          state,
        });
      }
    }

    toDOM(view: EditorView): HTMLElement {
      const dom = super.toDOM(view);
      let isFocused = false;
      dom.addEventListener("focusin", () => {
        isFocused = true;
        view.dispatch({
          selection: {
            anchor: this.match.from,
          },
        });
      });
      dom.addEventListener("focusout", () => {
        isFocused = false;
      });
      dom.addEventListener("click", () => {
        if (!isFocused) {
          view.dispatch({
            selection: {
              anchor: this.match.from,
              head: this.match.to,
            },
          });
        }
      });
      for (const [, component] of this.inputs) {
        component.$set({ view });
      }
      if (this.isNew) {
        requestAnimationFrame(() => {
          this.focusGroup.first();
        });
      }
      return dom;
    }

    destroy(dom: HTMLElement): void {
      for (const [, component] of this.inputs) {
        component.$set({ view: null });
        component.$destroy();
      }
      super.destroy(dom);
    }

    enterFromStart(): boolean {
      return this.focusGroup.first();
    }

    enterFromEnd(): boolean {
      return this.focusGroup.last();
    }

    onLeaveStart(): void {
      this.view?.focus();
      this.view?.dispatch({
        selection: EditorSelection.single(this.match.from),
      });
    }

    onLeaveEnd(): void {
      let end = this.match.to;
      if (this.match.blockRanges.length) {
        end = this.match.blockRanges[0].from;
      }
      this.view?.focus();
      this.view?.dispatch({
        selection: EditorSelection.single(end),
      });
    }
  };
