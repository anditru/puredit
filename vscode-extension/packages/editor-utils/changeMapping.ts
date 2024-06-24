import { Transaction } from "@codemirror/state";
import type { Text } from "@codemirror/state";
import { ChangeDocumentPayload, ChangeType } from "@puredit/webview-interface";
import { EndOfLine } from "./projectionalEditor";

import { logProvider } from "../../../logconfig";
const logger = logProvider.getLogger("vscode.editor-utils.changeMapping");

export function mapTransactionToChanges(transaction: Transaction, eol: EndOfLine): Change[] {
  const changes: Change[] = [];
  transaction.changes.iterChanges(
    (fromBefore: number, toBefore: number, fromAfter: number, toAfter: number, inserted: Text) => {
      const previousDelta = changes[changes.length - 1]?.delta || 0;
      const lineShift = {
        fromBefore: 0,
        toBefore: 0,
        fromAfter: 0,
        toAfter: 0,
      };
      if (eol === EndOfLine.CRLF) {
        const beforeDoc = transaction.startState.doc;
        const afterDoc = transaction.newDoc;
        lineShift.fromBefore = beforeDoc.lineAt(fromBefore).number - 1;
        lineShift.toBefore = beforeDoc.lineAt(toBefore).number - 1;
        lineShift.fromAfter = afterDoc.lineAt(fromAfter).number - 1;
        lineShift.toAfter = afterDoc.lineAt(toAfter).number - 1;
      }
      logger.debug(
        `Mapping change ${JSON.stringify(
          { fromBefore, toBefore, fromAfter, toAfter, inserted },
          null,
          2
        )} with delta ${previousDelta} and lineShift ${JSON.stringify(lineShift)}...`
      );

      const change = new Change(
        fromBefore + previousDelta + lineShift.fromBefore,
        toBefore + previousDelta + lineShift.toBefore,
        fromAfter + previousDelta + lineShift.fromAfter,
        toAfter + previousDelta + lineShift.toAfter,
        inserted
      );
      logger.debug(`to ${JSON.stringify(change, null, 2)}`);
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
    return this.lengthBefore > 0 && this.lengthAfter > 0 && !this.insertsNoText();
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
