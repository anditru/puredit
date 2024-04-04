import { assert, isString } from "@puredit/utils";
import type { Tree } from "web-tree-sitter";
import { selectDeepChild } from "./path";
import { PatternCursor, PatternNode } from "./pattern";
import { ProjectionSegment } from "./projections";
import { Language } from "./common";
import { loadBlocksConfigFor } from "@puredit/language-config";
import { BlockVariableMap, Path, Variable } from "./context-var-detection/blockVariableMap";
import AstCursor from "@puredit/parser/ast/cursor";

export function serializePattern(
  sampleTree: Tree,
  pattern: PatternNode,
  variablePaths: Path[],
  undeclaredVariables: BlockVariableMap,
  language: Language,
  ignoreBlocks: boolean
): string {
  const source = sampleTree.rootNode.text;
  let result = "";
  let from = 0;
  const blockNodeType = loadBlocksConfigFor(language).blockNodeType;
  let contextVariables: Variable[];
  if (ignoreBlocks) {
    contextVariables = undeclaredVariables.getAll();
  } else {
    contextVariables = undeclaredVariables.get([0]);
  }
  variablePaths = [...variablePaths].concat(
    contextVariables.map((contextVariable: Variable) => contextVariable.path)
  );
  orderByAppearance(variablePaths);

  for (let i = 0; i < variablePaths.length; i++) {
    const sampleCursor = new AstCursor(sampleTree.walk());
    assert(
      selectDeepChild(sampleCursor, variablePaths[i]),
      "variable path not found in sample tree"
    );
    const patternCursor = new PatternCursor(pattern);
    assert(
      selectDeepChild(patternCursor, variablePaths[i]),
      "variable path not found in pattern tree"
    );
    result += escapeTemplateCode(source.slice(from, sampleCursor.startIndex));
    const name = `var${i}`;
    if (patternCursor.currentNode.type === blockNodeType) {
      const variablesForBlock = undeclaredVariables.get(variablePaths[i]);
      result += "${block(" + serializeContextVariables(variablesForBlock) + ")}";
    } else if (isContextVariable(variablePaths[i], contextVariables)) {
      result += '${contextVariable("' + sampleCursor.currentNode.text + '")}';
    } else {
      result += '${arg("' + name + '", ["' + patternCursor.currentNode.type + '"])}';
    }
    from = sampleCursor.endIndex;
  }
  result += escapeTemplateCode(source.slice(from));
  return result;
}

function orderByAppearance(paths: Path[]) {
  return paths.sort((a: Path, b: Path) => {
    const minLength = Math.min(a.length, b.length);
    for (let i = 0; i <= minLength; i++) {
      if (a[i] === undefined && b[i] !== undefined) {
        return -1;
      } else if (a[i] !== undefined && b[i] === undefined) {
        return 1;
      } else if (a[i] === undefined && b[i] === undefined) {
        return 0;
      }

      if (a[i] < b[i]) {
        return -1;
      } else if (a[i] > b[i]) {
        return 1;
      }
    }
  });
}

function isContextVariable(path: Path, contextVariables: Variable[]): boolean {
  return !!contextVariables.find((contextVariable) => contextVariable.path === path);
}

function serializeContextVariables(variables: Variable[]) {
  if (variables && variables.length > 0) {
    const assignments = variables.map((variable) => `"${variable.name}": undefined`).join(", ");
    return `{ ${assignments} }`;
  } else {
    return "";
  }
}

export function serializeProjection(projection: ProjectionSegment[]): string {
  const result: string[] = [];
  for (const segment of projection) {
    if (isString(segment)) {
      result.push(segment);
    } else {
      result.push("{" + segment.names.join(", ") + "}");
    }
  }
  return result.join(" ");
}

function escapeTemplateCode(input: string): string {
  return input.replaceAll("${", '${"${"}').replaceAll("`", '${"`"}');
}
