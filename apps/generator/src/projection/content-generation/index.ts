import fs from "fs";
import { ProjectionSegment, scanProjections } from "./projection/scan";
import { scanCode } from "./code/scan";
import { connectParameters, setVariableNames } from "./variables";
import { serializePattern } from "./serialize";
import { isString } from "@puredit/utils";
import { Language, supportedLanguages } from "./common";
import { parseCodeSamples } from "./code/parse";
import { parseProjections } from "./projection/parse";

export interface ProjectionContent {
  declarationString: string;
  templateString: string;
  componentContent: string;
}

export function generateProjectionContentFromFile(
  samplesFilePath: string,
  language: Language,
  ignoreBlocks: boolean
): Promise<ProjectionContent> {
  if (!supportedLanguages.includes(language) && samplesFilePath) {
    throw new Error(`Templates for language ${language} cannot be generated`);
  }
  const { codeSamples, projectionSamples } = extractCodeAndProjections(samplesFilePath);
  return generateProjectionContent(codeSamples, projectionSamples, language, ignoreBlocks);
}

export async function generateProjectionContent(
  codeSamples: string[],
  projectionSamples: string[],
  language: Language,
  ignoreBlocks: boolean
): Promise<ProjectionContent> {
  const sampleAsts = await parseCodeSamples(codeSamples, language);
  const projectionTokens = parseProjections(projectionSamples);

  const projectionSegments = scanProjections(projectionTokens);
  const { pattern, templateParameters } = scanCode(sampleAsts, language, ignoreBlocks);

  const [declarationString, templateString] = serializePattern(
    sampleAsts[0],
    pattern,
    templateParameters
  );

  const argumentPaths = templateParameters.getTemplateArguments().map((argument) => argument.path);
  const connections = connectParameters(
    sampleAsts,
    projectionTokens,
    argumentPaths,
    projectionSegments
  );
  setVariableNames(projectionSegments, connections);

  const componentContent = projectionSegments
    .reduce(reduceSegments, [])
    .map(projectionSegmentTemplate)
    .join("\n");

  return {
    declarationString,
    templateString,
    componentContent,
  };
}

function extractCodeAndProjections(samplesFilePath: string) {
  let doubleNewline = "\n\n";
  if (process.platform === "win32") {
    doubleNewline = "\r\n\r\n";
  }
  const samplesRaw = fs.readFileSync(samplesFilePath, { encoding: "utf-8" });
  const [codeRaw, projectionsRaw] = samplesRaw.split(`${doubleNewline}---${doubleNewline}`);
  return {
    codeSamples: codeRaw.split(doubleNewline),
    projectionSamples: projectionsRaw.split(doubleNewline),
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
