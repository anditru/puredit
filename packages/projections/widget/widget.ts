import type { EditorState } from "@codemirror/state";
import { EditorView, WidgetType } from "@codemirror/view";
import type { Match } from "@puredit/parser";
import { ContextInformation } from "../types";
import { Range } from "../types";

/**
 * @class
 * Abstract class all kinds of widgets must inherit from.
 */
export abstract class ProjectionWidget extends WidgetType {
  private dom: HTMLElement;
  protected view: EditorView | null = null;

  constructor(
    protected range: Range,
    protected isNew: boolean,
    public match: Match,
    public context: ContextInformation,
    state: EditorState
  ) {
    super();
    this.dom = this.initialize(match, context, state);
    this.update(match, context, state);
  }

  set(range: Range, match: Match, context: ContextInformation, state: EditorState) {
    this.range = range;
    this.isNew = false;
    this.match = match;
    this.context = context;
    this.update(match, context, state);
  }

  protected abstract initialize(
    match: Match,
    context: ContextInformation,
    state: EditorState
  ): HTMLElement;

  protected abstract update(match: Match, context: ContextInformation, state: EditorState): void;

  get position(): number | undefined {
    return this.view?.posAtDOM(this.dom);
  }

  eq(other: ProjectionWidget): boolean {
    return other.match === this.match;
  }

  toDOM(view: EditorView): HTMLElement {
    this.view = view;
    if (this.nextToLineStartOrSpace(view.state)) {
      this.dom.classList.remove("space-left");
    } else {
      this.dom.classList.add("space-left");
    }
    return this.dom;
  }

  private nextToLineStartOrSpace(state: EditorState): boolean {
    const line = state.doc.lineAt(this.match.from);
    if (this.range.from === line.from) {
      return true;
    }
    const charLeft = state.doc.slice(this.range.from - 1, this.range.from).toString();
    return /^\s$/.test(charLeft);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  destroy(_dom: HTMLElement): void {
    this.view = null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ignoreEvent(_event: Event): boolean {
    return true;
  }

  enterFromStart(): boolean {
    return false;
  }

  enterFromEnd(): boolean {
    return false;
  }
}

export interface ProjectionWidgetClass {
  new (
    range: Range,
    isNew: boolean,
    match: Match,
    context: ContextInformation,
    state: EditorState
  ): ProjectionWidget;
}
