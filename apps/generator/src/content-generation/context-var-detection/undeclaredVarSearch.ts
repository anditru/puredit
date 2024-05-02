import AstCursor from "@puredit/parser/ast/cursor";
import { BlockVariableMap } from "./blockVariableMap";
import AstNode from "@puredit/parser/ast/node";
import SymbolTable from "./symbolTable";
import { TreePath } from "@puredit/parser";

export default abstract class UndeclaredVarSearch {
  protected abstract readonly NON_VARIABLE_CONDITIONS: CursorCondition[];
  protected abstract readonly DECLARATION_CONTINUING_CONDITIONS: CursorCondition[];
  protected abstract readonly DECLARATION_TERMINATING_CONDITIONS: CursorCondition[];
  protected abstract readonly DECLARATION_INDUCING_CONDITIONS: CursorCondition[];
  protected abstract readonly IDENTIFIER_NODE_TYPES: string[];
  protected abstract readonly BLOCK_NODE_TYPE: string;
  protected abstract readonly MODULE_NODE_TYPE: string;

  protected readonly astCursor: AstCursor;
  protected readonly symbolTable = new SymbolTable();
  private currentBlockPath: number[] = [];
  private blockToVariablesMap = new BlockVariableMap();

  constructor(startNode: AstNode) {
    this.astCursor = startNode.walk();
  }

  execute(): BlockVariableMap {
    this.blockToVariablesMap.set([], []);
    this.recurse();
    return this.blockToVariablesMap;
  }

  private recurse() {
    this.visitNode();
    if (this.astCursor.goToFirstChild()) {
      do {
        this.recurse();
      } while (this.astCursor.goToNextSibling());
      if (this.astCursor.currentNode.type === this.BLOCK_NODE_TYPE) {
        this.symbolTable.exitBlock();
      }
      this.astCursor.goToParent();
    }
  }

  private visitNode(): void {
    const currentNodeType = this.astCursor.currentNode.type;
    if (this.IDENTIFIER_NODE_TYPES.includes(currentNodeType)) {
      this.visitIdentifier();
    } else if (currentNodeType === this.BLOCK_NODE_TYPE) {
      this.visitBlock();
    }
  }

  private visitBlock() {
    this.symbolTable.enterBlock();
    this.currentBlockPath = this.astCursor.currentPath;
    this.blockToVariablesMap.set(this.currentBlockPath, []);
  }

  private visitIdentifier(): undefined {
    const currentNode = this.astCursor.currentNode;
    const identifierName = currentNode.text;
    const occurenceInfo = this.inspectIdentifierOccurence();

    if (occurenceInfo.isVariable == null) {
      throw new Error(`Cloud not determine if identifier ${identifierName} is variable`);
    } else if (occurenceInfo.isVariable && !occurenceInfo.type) {
      console.log(this.astCursor.currentNode.parent.text);
      throw new Error(
        `Could not determine if occurence of variable identifier ${identifierName} is declaring or applied`
      );
    }

    if (occurenceInfo.isVariable && occurenceInfo.type === IdentifierOccurenceType.Declaring) {
      this.processVariableDeclaration(identifierName);
    } else if (occurenceInfo.isVariable && occurenceInfo.type === IdentifierOccurenceType.Applied) {
      this.processVariableReference(identifierName);
    }
  }

  private inspectIdentifierOccurence(): IdentifierOccurenceInfo {
    const isVariable = this.isVariable();
    let type: IdentifierOccurenceType | null = null;
    if (this.isVariable()) {
      type = this.determineVariableOccurenceType();
    }
    return {
      isVariable,
      type,
    };
  }

  private isVariable(): boolean {
    return !this.matchesOneOf(this.NON_VARIABLE_CONDITIONS);
  }

  private determineVariableOccurenceType(): IdentifierOccurenceType | null {
    const returnSteps = [this.astCursor.currentNode.getChildIndex()];
    let occurenceType: IdentifierOccurenceType | null | undefined;
    do {
      const childIndex = this.astCursor.currentNode.getChildIndex();
      if (this.matchesOneOf(this.DECLARATION_CONTINUING_CONDITIONS)) {
        returnSteps.push(childIndex);
        continue;
      } else if (this.matchesOneOf(this.DECLARATION_TERMINATING_CONDITIONS)) {
        occurenceType = IdentifierOccurenceType.Applied;
      } else if (this.matchesOneOf(this.DECLARATION_INDUCING_CONDITIONS)) {
        occurenceType = IdentifierOccurenceType.Declaring;
      } else {
        occurenceType = null;
      }
      returnSteps.push(childIndex);
    } while (
      occurenceType === undefined &&
      this.astCursor.currentNode.parent.type !== this.MODULE_NODE_TYPE &&
      this.astCursor.goToParent()
    );
    returnSteps.pop();
    this.astCursor.follow(new TreePath(returnSteps.reverse()));
    return occurenceType || null;
  }

  private matchesOneOf(conditions: CursorCondition[]): boolean {
    const parentType = this.astCursor.currentNode.parent.type;
    const fieldName = this.astCursor.currentFieldName;
    for (const condition of conditions) {
      if (condition.fieldName === fieldName && condition.parentType === parentType) {
        return true;
      }
    }
    return false;
  }

  private processVariableDeclaration(identifier: string) {
    const assigningNode = this.symbolTable.searchIdentifier(identifier);
    if (!assigningNode) {
      this.symbolTable.enterIdentifier(identifier, this.astCursor.currentNode);
    }
  }

  private processVariableReference(identifier: string) {
    const declaringNode = this.symbolTable.searchIdentifier(identifier);
    if (!declaringNode) {
      const undeclaredVariablesCurrentBlock = this.blockToVariablesMap.get(this.currentBlockPath);
      undeclaredVariablesCurrentBlock.push({
        path: this.astCursor.currentPath,
        name: identifier,
      });
    }
  }
}

interface CursorCondition {
  parentType: string;
  fieldName: string | undefined;
}

interface IdentifierOccurenceInfo {
  isVariable: boolean;
  type: IdentifierOccurenceType | null;
}

enum IdentifierOccurenceType {
  Declaring = "declaring",
  Applied = "applied",
}
