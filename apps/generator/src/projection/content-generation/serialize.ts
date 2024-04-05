import { assert, isString } from "@puredit/utils";
import type { Tree } from "web-tree-sitter";
import { PatternCursor, PatternNode } from "./pattern";
import { ProjectionSegment } from "./projection/scan";
import AstCursor from "@puredit/parser/ast/cursor";
import TemplateParameterArray from "./template/parameterArray";

export function serializePattern(
  sampleTree: Tree,
  pattern: PatternNode,
  templateParameters: TemplateParameterArray
): [string, string] {
  const source = sampleTree.rootNode.text;
  let declarationsResult = "";
  let patternResult = "";
  let from = 0;
  templateParameters.sortByAppearance();

  for (let i = 0; i < templateParameters.length; i++) {
    const sampleCursor = new AstCursor(sampleTree.walk());
    assert(
      sampleCursor.follow(templateParameters[i].path),
      "variable path not found in sample tree"
    );
    const patternCursor = new PatternCursor(pattern);
    assert(
      patternCursor.follow(templateParameters[i].path),
      "variable path not found in pattern tree"
    );
    declarationsResult += templateParameters[i].toDeclarationString();
    patternResult += escapeTemplateCode(source.slice(from, sampleCursor.startIndex));
    patternResult += templateParameters[i].toTemplatePart();
    from = sampleCursor.endIndex;
  }
  patternResult += escapeTemplateCode(source.slice(from));
  return [declarationsResult, patternResult];
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
