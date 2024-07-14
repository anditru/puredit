import { Transaction } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import type { ViewUpdate } from "@codemirror/view";
import { forceRecreateDecorationsEffect, rematchEffect } from "./stateField";

export const debouncedTypeListener = EditorView.updateListener.of((update: ViewUpdate) => {
  const tr = update.transactions[0];
  if (
    tr &&
    !tr.effects.some((effect) => effect.is(rematchEffect)) &&
    (tr.docChanged ||
      tr.selection ||
      tr.effects.some((effect) => effect.is(forceRecreateDecorationsEffect)))
  ) {
    const rematchController = Debouncer.getInstance();
    rematchController.bufferTransaction(tr);
    rematchController.triggerRematching(update.view);
  }
});

export class Debouncer {
  private static instance: Debouncer | undefined;

  static getInstance() {
    if (!this.instance) {
      this.instance = new Debouncer();
    }
    return this.instance;
  }

  private transactionBuffer: Transaction[] = [];
  private delay = 200;
  private timeout: NodeJS.Timeout | undefined;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  bufferTransaction(transaction: Transaction) {
    this.transactionBuffer.push(transaction);
  }

  flushTransactionBuffer() {
    this.transactionBuffer = [];
  }

  getBufferedTransactions() {
    return this.transactionBuffer;
  }

  setDelay(delay: number) {
    this.delay = delay;
  }

  triggerRematching(view: EditorView) {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(() => {
      this.rematch(view);
    }, this.delay);
  }

  rematch(view: EditorView) {
    view.dispatch({
      effects: rematchEffect.of(null),
    });
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  executeDebounced(fn: Function, ...args: any) {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(() => {
      fn(args);
    }, this.delay);
  }
}
