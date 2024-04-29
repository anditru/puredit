import { ProjectionSegment, scanProjections } from "./projection/scan";
import { scanCode } from "./code/scan";
import { connectArguments, setArgumentNames } from "./variables";
import { serializePattern, serializeWidget } from "./serialize";
import { supportedLanguages } from "./common";
import { ProjectionTree } from "./projection/parse";
import { TemplateChain } from "./template/chain";
import { ProjectionContent } from "./common";
import SubProjectionGenerator from "../subProjection/subProjectionGenerator";
import ProjectionGenerator from "../projection/projectionGenerator";
import { SubProjectionContentGenerator } from "./internal";
import ComplexTemplateParameter from "./template/complexParameter";
import { TemplateAggregation } from "./template/aggregation";
import { SubProjectionResolver, SubProjectionSolution } from "./subProjectionResolution";
import { PatternNode } from "./pattern";
import TemplateParameterArray from "./template/parameterArray";
import AstNode from "@puredit/parser/ast/node";
import { BlockVariableMap } from "./context-var-detection/blockVariableMap";

export default abstract class ContentGenerator {
  // Input
  protected projectionPath: string;
  protected ignoreBlocks = true;
  protected codeSamples: string[];
  protected codeAsts: AstNode[];
  protected projectionTrees: ProjectionTree[];

  // State
  protected undeclaredVariableMap: BlockVariableMap;
  protected globalTemplateParameters: TemplateParameterArray;
  private subProjectionSolution: SubProjectionSolution;
  private pattern: PatternNode;
  private templateParameters: TemplateParameterArray;
  private segmentsPerWidget: ProjectionSegment[][];

  // Output
  private parameterDeclarations: string;
  private templateString: string;
  private paramToSubProjectionsMap: Record<string, string[]> = {};
  private allSubProjections: string[] = [];
  private segmentWidgetContents: string[] = [];
  private postfixWidgetContent: string;

  constructor(protected readonly generator: ProjectionGenerator | SubProjectionGenerator) {}

  protected assertLanguageAvailable() {
    if (!supportedLanguages.includes(this.generator.language)) {
      throw new Error(`Templates for language ${this.generator.language} cannot be generated`);
    }
  }

  protected async generateContent(): Promise<ProjectionContent> {
    await this.generatePattern();
    await this.resolveSubProjections();
    await this.generateSubProjections();
    this.serializePattern();
    this.generateWidgets();
    this.serializeWidgets();

    return new ProjectionContent(
      this.parameterDeclarations,
      this.templateString,
      this.paramToSubProjectionsMap,
      this.segmentWidgetContents,
      this.allSubProjections,
      this.postfixWidgetContent
    );
  }

  private async generatePattern() {
    const { pattern, templateParameters } = await scanCode(
      this.codeAsts,
      this.generator.language,
      this.undeclaredVariableMap,
      this.ignoreBlocks
    );
    this.pattern = pattern;
    this.templateParameters = templateParameters;
  }

  private async resolveSubProjections() {
    const subProjectionResolver = new SubProjectionResolver(
      this.codeSamples,
      this.codeAsts,
      this.projectionTrees,
      this.templateParameters.getComplexParams()
    );
    this.subProjectionSolution = await subProjectionResolver.execute();
    this.templateParameters.removeUnusedParameters(Array.from(this.subProjectionSolution.keys()));
  }

  private serializePattern() {
    const [parameterDeclarations, templateString] = serializePattern(
      this.codeAsts[0],
      this.pattern,
      this.templateParameters
    );
    this.parameterDeclarations = parameterDeclarations;
    this.templateString = templateString;
  }

  private async generateSubProjections() {
    const complexParams = this.templateParameters.getComplexParams();
    this.allSubProjections = [];

    for (let paramIndex = 0; paramIndex < complexParams.length; paramIndex++) {
      const param = complexParams[paramIndex];
      let allSubProjectionsBelow: any, newSubProjections: string[];
      if (param instanceof TemplateChain) {
        [
          allSubProjectionsBelow,
          newSubProjections
        ] = await this.generateSubProjectionsForChain(param);
      } else if (param instanceof TemplateAggregation) {
        [
          allSubProjectionsBelow,
          newSubProjections
        ] = await this.generateSubProjectionsForAggregation(param);
      } else {
        throw new Error("Unsupported template argument for subprojection generation");
      }
      this.paramToSubProjectionsMap[param.toVariableName()] = newSubProjections;
      this.allSubProjections = this.allSubProjections.concat(allSubProjectionsBelow);
    }
  }

  private generateWidgets() {
    const projectionTokens = this.projectionTrees.map((sample) => sample.getProjectionTokens());
    const projectionSegments = scanProjections(projectionTokens);
    const argumentPaths = this.templateParameters
      .getTemplateArguments()
      .map((argument) => argument.path);
    const connections = connectArguments(
      this.codeAsts,
      projectionTokens,
      argumentPaths,
      projectionSegments
    );
    const templateArguments = this.templateParameters.getTemplateArguments();
    setArgumentNames(projectionSegments, connections, templateArguments);

    const widgetBoundries = this.projectionTrees[0].getWidgetBoundries();
    this.segmentsPerWidget = widgetBoundries.map((boundry, index) => {
      const startIndex = index ? widgetBoundries[index - 1] + 1 : 0;
      return projectionSegments.slice(startIndex, boundry + 1);
    });
  }

  private serializeWidgets() {
    const complexParams = this.templateParameters.getComplexParams();
    if (complexParams.length && this.hasPostfixWidget(complexParams[complexParams.length - 1])) {
      const widgetContents = this.segmentsPerWidget.map(
        (widgetSegments) => serializeWidget(widgetSegments)
      );
      this.segmentWidgetContents = widgetContents.slice(0, widgetContents.length - 1);
      this.postfixWidgetContent = widgetContents[widgetContents.length - 1];
    } else {
      this.segmentWidgetContents = this.segmentsPerWidget.map(
        (widgetSegments) => serializeWidget(widgetSegments)
      );
    }
  }

  private hasPostfixWidget(lastParamWithSubProj: ComplexTemplateParameter) {
    const lastSubProjRangeEnd = lastParamWithSubProj.getEndIndex(
      this.codeAsts[0].walk()
    );
    const widgets = this.projectionTrees[0].widgets;
    const lastWidget = widgets[widgets.length - 1];
    return lastWidget.tokens.length > 0 && lastSubProjRangeEnd + 1 === this.codeSamples[0].length;
  }

  private async generateSubProjectionsForChain(
    templateParam: TemplateChain
  ): Promise<[string[], string[]]> {
    const samplesForParam = this.subProjectionSolution.get(templateParam);
    const numSubProj = samplesForParam[0].projections.length;
    let allSubProjections = [];
    const newSubProjections = [];
    for (let subProjIndex = 0; subProjIndex < numSubProj; subProjIndex++) {
      const projectionSamples = samplesForParam.map((group) => group.projections[subProjIndex]);
      let codeSampleParts: string[];
      let relevantGlobalTemplateParams: TemplateParameterArray;
      if (subProjIndex === 0) {
        // Chain start
        codeSampleParts = this.codeSamples.map(
          (sample, index) => templateParam.start.extractText(this.codeAsts[index].walk(), sample)
        );
        relevantGlobalTemplateParams = this.globalTemplateParameters.getParamsBelow(templateParam.start.nodePath);
        console.log(
          `\nGenerating subprojection for chain start ` +
            `with code samples\n${codeSampleParts.join("\n")}`
        );
      } else {
        // Chain links
        codeSampleParts = this.codeSamples.map((sample, index) =>
          templateParam.links[numSubProj - subProjIndex - 1].extractText(
            this.codeAsts[index].walk(),
            sample
          )
        );
        relevantGlobalTemplateParams = this.globalTemplateParameters.getParamsBelow(templateParam.links[numSubProj - subProjIndex - 1].startNodePath);
        console.log(
          `\nGenerating subprojection for chain link ` +
            `with code samples\n${codeSampleParts.join("\n")}`
        );
      }
      const subProjectionGenerator = new SubProjectionGenerator(this.generator.fs);
      subProjectionGenerator.setProjectionPath(this.projectionPath);
      const contentGenerator = new SubProjectionContentGenerator(subProjectionGenerator);
      const subProjectionsBelow = await contentGenerator.execute(
        this.projectionPath,
        codeSampleParts,
        projectionSamples,
        this.undeclaredVariableMap,
        relevantGlobalTemplateParams,
        this.ignoreBlocks
      );
      newSubProjections.push(subProjectionsBelow[subProjectionsBelow.length - 1]);
      allSubProjections = allSubProjections.concat(subProjectionsBelow);
    }
    templateParam.startSubProjectionName = newSubProjections[0];
    templateParam.linkSubProjectionNames = newSubProjections.slice(1);
    return [allSubProjections, newSubProjections];
  }

  private async generateSubProjectionsForAggregation(
    templateParam: TemplateAggregation
  ): Promise<[string[], string[]]> {
    const samplesForParam = this.subProjectionSolution.get(templateParam);
    const numSubProj = samplesForParam[0].projections.length;
    let allSubProjections = [];
    const newSubProjections = [];
    for (let subProjIndex = 0; subProjIndex < numSubProj; subProjIndex++) {
      const projectionSamples = samplesForParam.map((group) => group.projections[subProjIndex]);
      let codeSampleParts: string[];
      let relevantGlobalTemplateParams: TemplateParameterArray;
      if (subProjIndex === 0 && templateParam.start) {
        // Special start pattern
        codeSampleParts = this.codeSamples.map(
          (sample, index) => templateParam.start.extractText(this.codeAsts[index].walk(), sample)
        );
        relevantGlobalTemplateParams = this.globalTemplateParameters.getParamsBelow(templateParam.start.path);
        console.log(
          `\nGenerating subprojection for special start pattern ` +
            `with code samples\n${codeSampleParts.join("\n")}`
        );
      } else {
        // Aggregation parts
        const partIndex = templateParam.start ? subProjIndex - 1 : subProjIndex;
        codeSampleParts = this.codeSamples.map((sample, index) =>
          templateParam.parts[partIndex].extractText(
            this.codeAsts[index].walk(),
            sample
          )
        );
        relevantGlobalTemplateParams = this.globalTemplateParameters.getParamsBelow(templateParam.parts[partIndex].path);
        console.log(
          `\nGenerating subprojection for aggregation part ` +
            `with code samples\n${codeSampleParts.join("\n")}`
        );
      }
      const subProjectionGenerator = new SubProjectionGenerator(this.generator.fs);
      subProjectionGenerator.setProjectionPath(this.projectionPath);
      const contentGenerator = new SubProjectionContentGenerator(subProjectionGenerator);
      const subProjectionsBelow = await contentGenerator.execute(
        this.projectionPath,
        codeSampleParts,
        projectionSamples,
        this.undeclaredVariableMap,
        relevantGlobalTemplateParams,
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
