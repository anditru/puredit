import fs from "fs";
import { scanProjections } from "./projection/scan";
import { scanCode } from "./code/scan";
import { connectArguments, setArgumentNames } from "./variables";
import { serializePattern, serializeWidget } from "./serialize";
import { doubleNewline, supportedLanguages } from "./common";
import { ProjectionSample } from "./projection/parse";
import { TemplateChain } from "./template/chain";
import { ProjectionContent } from "./common";
import { TreeSitterParser } from "@puredit/parser/tree-sitter/treeSitterParser";
import SubProjectionGenerator from "../subProjection/subProjectionGenerator";
import ProjectionGenerator from "../projection/projectionGenerator";
import { SubProjectionContentGenerator } from "./internal";
import AstCursor from "@puredit/parser/ast/cursor";
import TemplateParameterWithSubProjections from "./template/parameterWithSubProjections";
import { TemplateAggregation } from "./template/aggregation";

export default abstract class ContentGenerator {
  protected projectionPath: string;
  protected ignoreBlocks = true;
  protected codeSamples: string[] = [];
  protected sampleAsts: TreeSitterParser.Tree[];
  protected parsedProjectionSamples: ProjectionSample[];

  constructor(protected readonly generator: ProjectionGenerator | SubProjectionGenerator) {}

  protected assertLanguageAvailable() {
    if (!supportedLanguages.includes(this.generator.language)) {
      throw new Error(`Templates for language ${this.generator.language} cannot be generated`);
    }
  }

  protected async generateContent(): Promise<ProjectionContent> {
    // Generate Pattern
    const { pattern, templateParameters } = scanCode(
      this.sampleAsts,
      this.generator.language,
      this.ignoreBlocks
    );
    templateParameters.removeUnusedParameters(this.parsedProjectionSamples);
    const paramsWithSubprojections = templateParameters.getParamsWithSubProjections();

    const paramToSubProjectionsMap: Record<string, string[]> = {};
    let reallyAllSubProjections = [];
    for (let paramIndex = 0; paramIndex < paramsWithSubprojections.length; paramIndex++) {
      const param = paramsWithSubprojections[paramIndex];
      let allSubProjections, newSubProjections;
      if (param instanceof TemplateChain) {
        [allSubProjections, newSubProjections] = await this.generateSubProjectionsForChain(
          param,
          paramIndex
        );
      } else if (param instanceof TemplateAggregation) {
        [allSubProjections, newSubProjections] = await this.generateSubProjectionsForAggregation(
          param,
          paramIndex
        );
      } else {
        throw new Error("Unsupported template argument for subprojection generation");
      }
      paramToSubProjectionsMap[param.toVariableName()] = newSubProjections;
      reallyAllSubProjections = reallyAllSubProjections.concat(allSubProjections);
    }

    const [parameterDeclarations, templateString] = serializePattern(
      this.sampleAsts[0],
      pattern,
      templateParameters
    );

    // Generate Widgets
    const projectionTokens = this.parsedProjectionSamples.map((sample) =>
      sample.getProjectionTokens()
    );
    const projectionSegments = scanProjections(projectionTokens);
    const argumentPaths = templateParameters
      .getTemplateArguments()
      .map((argument) => argument.path);
    const connections = connectArguments(
      this.sampleAsts,
      projectionTokens,
      argumentPaths,
      projectionSegments
    );
    const templateArguments = templateParameters.getTemplateArguments();
    setArgumentNames(projectionSegments, connections, templateArguments);

    const widgetBoundries = this.parsedProjectionSamples[0].getWidgetBoundries();
    const segmentsPerWidget = widgetBoundries.map((boundry, index) => {
      const startIndex = index ? widgetBoundries[index - 1] + 1 : 0;
      return projectionSegments.slice(startIndex, boundry + 1);
    });
    let segmentWidgetContents: string[] = [];
    let postfixWidgetContent: string | undefined;
    if (
      paramsWithSubprojections.length &&
      this.hasPostfixWidget(paramsWithSubprojections[paramsWithSubprojections.length - 1])
    ) {
      const widgetContents = segmentsPerWidget.map((widgetSegments) =>
        serializeWidget(widgetSegments)
      );
      segmentWidgetContents = widgetContents.slice(0, widgetContents.length - 1);
      postfixWidgetContent = widgetContents[widgetContents.length - 1];
    } else {
      segmentWidgetContents = segmentsPerWidget.map((widgetSegments) =>
        serializeWidget(widgetSegments)
      );
    }

    return new ProjectionContent(
      parameterDeclarations,
      templateString,
      paramToSubProjectionsMap,
      segmentWidgetContents,
      reallyAllSubProjections,
      postfixWidgetContent
    );
  }

  protected hasPostfixWidget(lastParamWithSubProj: TemplateParameterWithSubProjections) {
    const lastSubProjRangeEnd = lastParamWithSubProj.getEndIndex(
      new AstCursor(this.sampleAsts[0].walk())
    );
    const widgets = this.parsedProjectionSamples[0].widgets;
    const lastWidget = widgets[widgets.length - 1];
    return lastWidget.tokens.length > 0 && lastSubProjRangeEnd + 1 === this.codeSamples[0].length;
  }

  protected extractCodeAndProjections(samplesFilePath: string) {
    const samplesRaw = fs.readFileSync(samplesFilePath, { encoding: "utf-8" });
    const [codeRaw, projectionsRaw] = samplesRaw.split(`${doubleNewline}---${doubleNewline}`);
    return {
      codeSamples: codeRaw.split(doubleNewline),
      projectionSamples: projectionsRaw.split(doubleNewline),
    };
  }

  async generateSubProjectionsForChain(
    templateParam: TemplateChain,
    paramIndex: number
  ): Promise<[string[], string[]]> {
    const groupFromEachSample = this.parsedProjectionSamples.map(
      (projSample) => projSample.subProjectionGroups[paramIndex]
    );
    const numSubProj = groupFromEachSample[0].projections.length;
    let allSubProjections = [];
    const newSubProjections = [];
    for (let subProjIndex = 0; subProjIndex < numSubProj; subProjIndex++) {
      const projectionSamples = groupFromEachSample.map((group) => group.projections[subProjIndex]);
      let codeSampleParts: string[];
      if (subProjIndex === 0) {
        // Chain start
        codeSampleParts = this.codeSamples.map((sample, index) =>
          templateParam.start.extractText(new AstCursor(this.sampleAsts[index].walk()), sample)
        );
        console.log(
          `\nGenerating subprojection for chain start with code samples\n${codeSampleParts.join(
            "\n"
          )}`
        );
      } else {
        // Chain links
        codeSampleParts = this.codeSamples.map((sample, index) =>
          templateParam.links[numSubProj - subProjIndex - 1].extractText(
            new AstCursor(this.sampleAsts[index].walk()),
            sample
          )
        );
        console.log(
          `\nGenerating subprojection for chain link with code samples\n${codeSampleParts.join(
            "\n"
          )}`
        );
      }
      const subProjectionGenerator = new SubProjectionGenerator(this.generator.fs);
      subProjectionGenerator.setProjectionPath(this.projectionPath);
      const contentGenerator = new SubProjectionContentGenerator(subProjectionGenerator);
      const subProjectionsBelow = await contentGenerator.execute(
        this.projectionPath,
        codeSampleParts,
        projectionSamples,
        this.ignoreBlocks
      );
      newSubProjections.push(subProjectionsBelow[subProjectionsBelow.length - 1]);
      allSubProjections = allSubProjections.concat(subProjectionsBelow);
    }
    templateParam.startSubProjectionName = newSubProjections[0];
    templateParam.linkSubProjectionNames = newSubProjections.slice(1);
    return [allSubProjections, newSubProjections];
  }

  async generateSubProjectionsForAggregation(
    templateParam: TemplateAggregation,
    paramIndex: number
  ): Promise<[string[], string[]]> {
    const groupFromEachSample = this.parsedProjectionSamples.map(
      (projSample) => projSample.subProjectionGroups[paramIndex]
    );
    const numSubProj = groupFromEachSample[0].projections.length;
    let allSubProjections = [];
    const newSubProjections = [];
    for (let subProjIndex = 0; subProjIndex < numSubProj; subProjIndex++) {
      const projectionSamples = groupFromEachSample.map((group) => group.projections[subProjIndex]);
      let codeSampleParts: string[];
      if (subProjIndex === 0 && templateParam.start) {
        // Special start pattern start
        codeSampleParts = this.codeSamples.map((sample, index) =>
          templateParam.start.extractText(new AstCursor(this.sampleAsts[index].walk()), sample)
        );
        console.log(
          `\nGenerating subprojection for special start pattern with code samples\n${codeSampleParts.join(
            "\n"
          )}`
        );
      } else {
        // Aggregation parts
        const partIndex = templateParam.start ? subProjIndex - 1 : subProjIndex;
        codeSampleParts = this.codeSamples.map((sample, index) =>
          templateParam.parts[partIndex].extractText(
            new AstCursor(this.sampleAsts[index].walk()),
            sample
          )
        );
        console.log(
          `\nGenerating subprojection for aggregation part with code samples\n${codeSampleParts.join(
            "\n"
          )}`
        );
      }
      const subProjectionGenerator = new SubProjectionGenerator(this.generator.fs);
      subProjectionGenerator.setProjectionPath(this.projectionPath);
      const contentGenerator = new SubProjectionContentGenerator(subProjectionGenerator);
      const subProjectionsBelow = await contentGenerator.execute(
        this.projectionPath,
        codeSampleParts,
        projectionSamples,
        this.ignoreBlocks
      );
      newSubProjections.push(subProjectionsBelow[subProjectionsBelow.length - 1]);
      allSubProjections = allSubProjections.concat(subProjectionsBelow);
    }
    templateParam.startSubProjectionName = newSubProjections[0];
    templateParam.partSubProjectionNames = newSubProjections;
    return [allSubProjections, newSubProjections];
  }
}
