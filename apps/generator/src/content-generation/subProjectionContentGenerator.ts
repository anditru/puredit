import { parseCodeSamples } from "./code/parse";
import { ProjectionTree } from "./projection/parse";
import SubProjectionGenerator from "../subProjection/subProjectionGenerator";
import { ContentGenerator } from "./internal";

export default class SubProjectionContentGenerator extends ContentGenerator {
  constructor(generator: SubProjectionGenerator) {
    super(generator);
  }

  async execute(
    projectionPath: string,
    codeSamples: string[],
    parsedProjectionSamples: ProjectionTree[],
    ignoreBlocks: boolean
  ): Promise<string[]> {
    this.projectionPath = projectionPath;
    this.ignoreBlocks = ignoreBlocks;
    this.codeSamples = codeSamples;
    this.projectionTrees = parsedProjectionSamples;

    const projectionName = await this.generator.showPrompts();
    this.assertLanguageAvailable();
    this.codeAsts = await parseCodeSamples(this.codeSamples, this.generator.language);

    const projectionContent = await this.generateContent();
    await this.generator.writeFiles(projectionContent);
    projectionContent.allSubProjections.push(projectionName);
    return projectionContent.allSubProjections;
  }
}
