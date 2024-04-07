import fs from "fs";
import { ProjectionSegment, scanProjections } from "./projection/scan";
import { scanCode } from "./code/scan";
import { connectArguments, setArgumentNames } from "./variables";
import { serializePattern } from "./serialize";
import { isString } from "@puredit/utils";
import { doubleNewline, Language, supportedLanguages } from "./common";
import { parseCodeSamples } from "./code/parse";
import { parseProjections, ProjectionSample } from "./projection/parse";
import TemplateParameterArray from "./template/parameterArray";
import TemplateChain from "./template/chain";

export interface ProjectionContent {
  declarationString: string;
  templateString: string;
  widgets: string[];
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
  rawProjectionSamples: string[],
  language: Language,
  ignoreBlocks: boolean
): Promise<ProjectionContent> {
  // Parse
  const sampleAsts = await parseCodeSamples(codeSamples, language);
  const projectionSamples = parseProjections(rawProjectionSamples);

  // Generate Pattern
  const codeScanResult = scanCode(sampleAsts, language, ignoreBlocks);
  const pattern = codeScanResult.pattern;
  const templateParameters = resolveSubProjections(
    codeScanResult.templateParameters,
    projectionSamples
  );

  const [declarationString, templateString] = serializePattern(
    sampleAsts[0],
    pattern,
    templateParameters
  );

  // Generate Widgets
  const projectionTokens = projectionSamples.map((sample) => sample.getProjectionTokens());
  const projectionSegments = scanProjections(projectionTokens);
  const argumentPaths = templateParameters.getTemplateArguments().map((argument) => argument.path);
  const connections = connectArguments(
    sampleAsts,
    projectionTokens,
    argumentPaths,
    projectionSegments
  );
  setArgumentNames(projectionSegments, connections);

  const widgetBoundries = projectionSamples[0].getWidgetBoundries();
  const segmentsPerWidget = widgetBoundries.map((boundry, index) => {
    const startIndex = index ? widgetBoundries[index - 1] + 1 : 0;
    return projectionSegments.slice(startIndex, boundry + 1);
  });
  const widgets = segmentsPerWidget.map((widgetSegments) =>
    widgetSegments.reduce(reduceSegments, []).map(projectionSegmentTemplate).join("\n")
  );

  return {
    declarationString,
    templateString,
    widgets,
  };
}

function resolveSubProjections(
  templateParameters: TemplateParameterArray,
  projectionSamples: ProjectionSample[]
) {
  const subProjections = templateParameters.filter(
    (parameter) => parameter instanceof TemplateChain
  );
  const subProjectionGroups = projectionSamples[0].subProjectionGroups;
  if (subProjections.length !== subProjectionGroups.length) {
    throw Error("Provided subprojections do not fit code");
  }
  let filteredTemplateparameters = templateParameters;
  subProjections.forEach((subProjection) => {
    filteredTemplateparameters = filteredTemplateparameters.filter(
      (parameter) =>
        !(
          isPrefixOf(subProjection.path, parameter.path) &&
          parameter.path.length > subProjection.path.length
        )
    ) as TemplateParameterArray;
  });
  return filteredTemplateparameters;
}

function isPrefixOf(prefix: number[], target: number[]): boolean {
  if (target.length < prefix.length) {
    return false;
  }
  for (let i = 0; i < prefix.length; i++) {
    if (prefix[i] === target[i]) {
      return true;
    }
  }
  return true;
}

function extractCodeAndProjections(samplesFilePath: string) {
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
