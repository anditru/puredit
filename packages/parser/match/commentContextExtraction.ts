import { CommentTypeConfig, loadCommentsConfigFor } from "@puredit/language-config";
import { VerificationResult } from "./types";
import AstNode from "../ast/node";

export default class CommentContextExtraction {
  constructor(private readonly verificationResult: VerificationResult) {}

  execute(): object | Array<any> | null {
    const commentsConfig = loadCommentsConfigFor(this.verificationResult.pattern.language);
    let matchNode = this.verificationResult.node;
    while (matchNode.type !== commentsConfig.statementNodeType) {
      if (!matchNode.parent) {
        return null;
      }
      matchNode = matchNode.parent;
    }
    let childIndex;
    try {
      childIndex = matchNode.getChildIndex();
    } catch (error) {
      return null;
    }
    const matchParent = matchNode.parent;
    const commentTypeConfigs = commentsConfig.commentTypes;

    for (let i = childIndex - 1; i >= 0; i--) {
      const child = matchParent!.children[i];
      const commentTypeConfig = commentTypeConfigs[child.type];
      if (!commentTypeConfig) {
        break;
      }
      const context = this.searchContextIn(child, commentTypeConfig);
      if (context) {
        return context;
      }
    }
    return null;
  }

  private searchContextIn(
    node: AstNode,
    commentTypeConfig: CommentTypeConfig
  ): object | Array<any> | null {
    for (const startTokenRegex of commentTypeConfig.startTokenRegexes) {
      const startRegex = new RegExp(`^\\s*${startTokenRegex}\\s*CONTEXT\\s*:\\s*`);
      let commentText = node.text;
      const startMatch = commentText.match(startRegex);
      if (!startMatch) {
        continue;
      }
      commentText = commentText.slice(startMatch[0].length);
      if (commentText.startsWith("{")) {
        return this.searchObjectContextIn(commentText);
      } else if (commentText.startsWith("[")) {
        return this.searchArrayContextIn(commentText);
      }
    }
    return null;
  }

  private searchObjectContextIn(text: string): object | null {
    const closingCandidates = this.findAllOccurrencesOf("}", text).reverse();
    return this.parseLargestJson(text, closingCandidates) as object;
  }

  private searchArrayContextIn(text: string): Array<any> | null {
    const closingCandidates = this.findAllOccurrencesOf("]", text).reverse();
    return this.parseLargestJson(text, closingCandidates) as Array<any>;
  }

  private findAllOccurrencesOf(char: string, text: string): number[] {
    const indexes = [];
    for (let i = 0; i < text.length; i++) {
      if (text[i] === char) {
        indexes.push(i);
      }
    }
    return indexes;
  }

  private parseLargestJson(text: string, closingCandidates: number[]): object | Array<any> | null {
    for (const closingCandidate of closingCandidates) {
      const textSlice = text.slice(0, closingCandidate + 1);
      let context;
      try {
        context = JSON.parse(textSlice);
      } catch (error) {
        continue;
      }
      return context;
    }
    return null;
  }
}
