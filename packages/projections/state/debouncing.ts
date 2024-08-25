/**
 * @module
 * Implements debouncing to aviod executing the pattern matching after each keystroke
 * but only when a sufficient amount of time elpases between two keystrokes (or in other
 * words: We only trigger pattern matching when the user's "typing frequency" drops below
 * a certain boundry).
 */

import { Transaction } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import type { ViewUpdate } from "@codemirror/view";
import { forceRecreateDecorationsEffect, rematchEffect } from "./stateField";

/**
 * @const
 * UpdateListener that stores incoming transactions in the transaction buffer of the Debouncer
 * and triggers the rematching if sufficient time has elapsed between the keystrokes.
 * When rematching is triggered the buffered transactions are used to compute the area that must
 * be rematched and and buffer is flushed.
 */
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
  if (tr && tr.annotation(Transaction.userEvent) === "delete.line") {
    update.view.dispatch({
      effects: rematchEffect.of(null),
    });
  }
});

/**
 * @class
 * Controls the debounced execution using a timeout that is reset everytime a keystroke or cursor
 * movement occurs. When the timeout elapses, a transaction with the rematchEffect is issued
 * tirggering the rematching.
 */
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

  /**
   * Executes an arbirary function debounced. This method is intended for the functions that
   * communicate updates caused by changes in the text fields of the projections such that
   * these are debounced as well.
   *
   * @param fn Function to execute debounced.
   * @param args Args to pass to the function.
   */
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
