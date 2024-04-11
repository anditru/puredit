import { Language } from "./common";
import { parseCodeSamples } from "./code/parse";
import { parseProjections } from "./projection/parse";
import ProjectionGenerator from "../projection/projectionGenerator";
import { ContentGenerator } from "./internal";
import path from "path";

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
    const { codeSamples, projectionSamples } = this.extractCodeAndProjections(samplesFilePath);
    this.ignoreBlocks = ignoreBlocks;
    this.codeSamples = codeSamples;

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
    this.sampleAsts = await parseCodeSamples(this.codeSamples, this.generator.language);
    this.parsedProjectionSamples = parseProjections(projectionSamples);

    const projectionContent = await this.generateContent();
    await this.generator.writeFiles(projectionContent);
  }
}
