import { doubleNewline, Language } from "./common";
import { parseCodeSamples } from "./code/parse";
import { parseProjections } from "./projection/parse";
import ProjectionGenerator from "../projection/projectionGenerator";
import { ContentGenerator } from "./internal";
import path from "path";
import fs from "fs";
import { handleUndeclaredVariables } from "./context-var-detection";
import TemplateParameterArray from "./template/parameterArray";

export default class ProjectionContentGenerator extends ContentGenerator {
  constructor(generator: ProjectionGenerator) {
    super(generator);
  }

  async execute(
    samplesFilePath: string,
    ignoreBlocks: boolean,
    displayName?: string,
    technicalName?: string,
    description?: string,
    language?: Language
  ) {
    const { codeSamples, projectionSamples } = extractCodeAndProjections(samplesFilePath);
    this.ignoreBlocks = ignoreBlocks;
    this.codeSamples = codeSamples;
    this.projectionSamples = projectionSamples;

    this.generator
      .setLanguage(language)
      .setDisplayName(displayName)
      .setTechnicalName(technicalName)
      .setDescription(description);

    const projectionName = await this.generator.showPrompts();
    this.projectionPath = path.resolve(
      (this.generator as ProjectionGenerator).packagePath,
      projectionName
    );
    this.assertLanguageAvailable();
    this.codeAsts = await parseCodeSamples(this.codeSamples, this.generator.language);
    this.projectionTrees = parseProjections(projectionSamples);
    await this.extractGlobalTemplateParams();

    const projectionContent = await this.generateContent();
    await this.generator.writeFiles(projectionContent);
  }

  private async extractGlobalTemplateParams() {
    const { undeclaredVariableMap, templateParameters } = await handleUndeclaredVariables(
      this.codeAsts,
      this.generator.language
    );
    this.undeclaredVariableMap = undeclaredVariableMap;
    this.globalTemplateParameters = new TemplateParameterArray(...templateParameters);
  }
}

function extractCodeAndProjections(samplesFilePath: string) {
  const samplesRaw = fs.readFileSync(samplesFilePath, { encoding: "utf-8" });
  const [codeRaw, projectionsRaw] = samplesRaw.split(`${doubleNewline}---${doubleNewline}`);
  return {
    codeSamples: codeRaw.split(doubleNewline),
    projectionSamples: projectionsRaw.split(doubleNewline),
  };
}
