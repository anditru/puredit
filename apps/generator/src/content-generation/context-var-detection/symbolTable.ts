import AstNode from "@puredit/parser/ast/node";

export default class SymbolTable {
  private delarationStacks: Record<string, AstNode[]> = {};
  private identifiersPerBlock: string[][] = [[]];

  enterBlock(): void {
    this.identifiersPerBlock.push([]);
  }

  exitBlock(): void {
    const currentBlockIdentifiers = this.identifiersPerBlock.pop();
    for (const identifierName of currentBlockIdentifiers) {
      this.delarationStacks[identifierName].pop();
    }
  }

  enterIdentifier(name: string, node: AstNode): void {
    const declarationStack = this.delarationStacks[name];
    if (declarationStack) {
      declarationStack.push(node);
    } else {
      this.delarationStacks[name] = [node];
    }
    this.identifiersPerBlock[this.identifiersPerBlock.length - 1].push(name);
  }

  searchIdentifier(name: string): AstNode | null {
    const declarationStack = this.delarationStacks[name];
    if (!declarationStack) {
      return null;
    }
    const node = declarationStack[declarationStack.length - 1];
    if (!node) {
      return null;
    }
    return node;
  }

  get blockDeepth(): number {
    return this.identifiersPerBlock.length - 1;
  }
}
