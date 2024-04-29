import { assert, isString } from "@puredit/utils";
import { PatternCursor, PatternNode } from "./pattern";
import { ProjectionSegment } from "./projection/scan";
import TemplateParameterArray from "./template/parameterArray";
import AstNode from "@puredit/parser/ast/node";

export function serializePattern(
  sampleRootNode: AstNode,
  pattern: PatternNode,
  templateParameters: TemplateParameterArray
): [string, string] {
  const source = sampleRootNode.text;
  let declarationsResult = "";
  let patternResult = "";
  let from = 0;
  templateParameters.sortByAppearance();

  for (let i = 0; i < templateParameters.length; i++) {
    const sampleCursor = sampleRootNode.walk();
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

function escapeTemplateCode(input: string): string {
  return input.replaceAll("${", '${"${"}').replaceAll("`", '${"`"}');
}

export function serializeWidget(widgetSegments: ProjectionSegment[]) {
  return widgetSegments.reduce(reduceSegments, []).map(projectionSegmentTemplate).join("\n");
}

const reduceSegments = (
  segments: ProjectionSegment[],
  segment: ProjectionSegment
): ProjectionSegment[] => {
  const previous = segments.length - 1;
  if (previous >= 0 && isString(segment) && isString(segments[previous])) {
    segments[previous] += " " + segment;
  } else {
    segments.push(segment);
  }
  return segments;
};

const projectionSegmentTemplate = (segment: ProjectionSegment) => {
  if (isString(segment)) {
    return `  <span>${segment}</span>`;
  }
  const targetNodes = segment.names.map((name) => `match.argsToAstNodeMap.${name}`);
  let targetNodesAttr = "";
  if (segment.names.length > 1) {
    targetNodesAttr = `\n    targetNodes={[${targetNodes.join(", ")}]}`;
  }
  return `  <TextInput
    className={highlightingFor(state, [tags.string])}
    node={${targetNodes[0]}}${targetNodesAttr}
    placeholder="${segment.names.join(", ")}"
    {state}
    {view}
    {focusGroup}
  />`;
};
