import { assert, isString } from "@puredit/utils";
import type { Tree } from "web-tree-sitter";
import { selectDeepChild } from "./path";
import { PatternCursor, PatternNode } from "./pattern";
import { ProjectionSegment } from "./projections";
import { Language } from "./common";
import { loadBlocksConfigFor } from "@puredit/language-config";

export function serializePattern(
  sampleTree: Tree,
  pattern: PatternNode,
  variables: number[][],
  language: Language
): string {
  const source = sampleTree.rootNode.text;
  let result = "";
  let from = 0;
  const blockNodeType = loadBlocksConfigFor(language).blockNodeType;

  for (let i = 0; i < variables.length; i++) {
    const sampleCursor = sampleTree.walk();
    assert(selectDeepChild(sampleCursor, variables[i]), "variable path not found in sample tree");
    const patternCursor = new PatternCursor(pattern);
    assert(selectDeepChild(patternCursor, variables[i]), "variable path not found in pattern tree");
    result += escapeTemplateCode(source.slice(from, sampleCursor.startIndex));
    const name = `var${i}`;
    if (patternCursor.nodeType === blockNodeType) {
      result += "${block()}";
    } else {
      result += '${arg("' + name + '", ["' + patternCursor.nodeType + '"])}';
    }
    from = sampleCursor.endIndex;
  }
  result += escapeTemplateCode(source.slice(from));
  return result;
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
