import { Transaction } from "@codemirror/state";
import type { Text } from "@codemirror/state";
import { ChangeDocumentPayload, ChangeType } from ".";

export function mapTransactionToChanges(transaction: Transaction): Change[] {
  const changes: Change[] = [];
  transaction.changes.iterChanges(
    (fromBefore: number, toBefore: number, fromAfter: number, toAfter: number, inserted: Text) => {
      const previousDelta = changes[changes.length - 1]?.delta || 0;
      const change = new Change(
        fromBefore + previousDelta,
        toBefore + previousDelta,
        fromAfter + previousDelta,
        toAfter + previousDelta,
        inserted
      );
      console.log(JSON.stringify(change));
      changes.push(change);
    }
  );
  return changes;
}

export class Change {
  readonly lengthBefore: number;
  readonly lengthAfter: number;
  readonly delta: number;

  constructor(
    readonly fromBefore: number,
    readonly toBefore: number,
    readonly fromAfter: number,
    readonly toAfter: number,
    readonly inserted: Text
  ) {
    this.lengthBefore = this.toBefore - this.fromBefore;
    this.lengthAfter = this.toAfter - this.fromAfter;
    this.delta = this.lengthAfter - this.lengthBefore;
  }

  isInsertion(): boolean {
    return this.lengthBefore === 0 && this.lengthAfter > 0;
  }

  isDeletion(): boolean {
    return this.lengthAfter < this.lengthBefore && this.insertsNoText();
  }

  isReplacement(): boolean {
    return this.lengthBefore !== this.lengthAfter && !this.insertsNoText();
  }

  insertsNoText(): boolean {
    return this.inserted.text.length === 1 && this.inserted.text[0] === "";
  }

  toChangeDocumentPayload(): ChangeDocumentPayload {
    return {
      type: this.getChangeType(),
      from: this.fromBefore,
      to: this.toBefore,
      insert: this.getInsertedText(),
    };
  }

  getChangeType(): ChangeType {
    if (this.isInsertion()) {
      return ChangeType.INSERTION;
    } else if (this.isReplacement()) {
      return ChangeType.REPLACEMENT;
    } else if (this.isDeletion()) {
      return ChangeType.DELETION;
    } else {
      throw new Error("Change cannot be processed");
    }
  }

  getInsertedText(): string {
    return this.inserted.text.join("\n");
  }
}
