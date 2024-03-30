import fs from "fs";
import { NodeWasmPathProvider } from "@puredit/node-utils";
import { Parser } from "@puredit/parser";
import { ProjectionSegment, scanProjections } from "./projections";
import { findUndeclaredVariables, scanCode } from "./code";
import { connectVariables, setVariableNames } from "./variables";
import { serializePattern } from "./serialize";
import { isString } from "@puredit/utils";
import { Language, supportedLanguages } from "./common";

export interface ProjectionContent {
  templateString: string;
  componentContent: string;
}

export async function generateProjectionContent(
  samplesFilePath: string,
  language: string,
  ignoreBlocks: boolean
): Promise<ProjectionContent> {
  if (!supportedLanguages.includes(language as Language) && samplesFilePath) {
    throw new Error(`Templates for language ${language} cannot be generated`);
  }

  let doubleNewline = "\n\n";
  if (process.platform === "win32") {
    doubleNewline = "\r\n\r\n";
  }

  const wasmPathProvider = new NodeWasmPathProvider(language as Language);
  const parser = await Parser.load(language as Language, wasmPathProvider);
  const samplesRaw = fs.readFileSync(samplesFilePath, { encoding: "utf-8" });
  const [codeRaw, projectionsRaw] = samplesRaw.split(`${doubleNewline}---${doubleNewline}`);

  const code = codeRaw.split(doubleNewline).map((sample) => parser.parse(sample));
  const projections = projectionsRaw.split(doubleNewline).map((sample) => sample.trim().split(" "));

  const projection = scanProjections(projections);
  const { pattern, variablePaths } = scanCode(code, language as Language, ignoreBlocks);
  const undeclaredVariables = findUndeclaredVariables(code, language as Language, ignoreBlocks);

  const connections = connectVariables(code, projections, variablePaths, projection);
  setVariableNames(projection, connections);

  const templateString = serializePattern(
    code[0],
    pattern,
    variablePaths,
    undeclaredVariables,
    language as Language,
    ignoreBlocks
  );
  const componentContent = projection
    .reduce(reduceSegments, [])
    .map(projectionSegmentTemplate)
    .join("\n");

  return {
    templateString,
    componentContent,
  };
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
