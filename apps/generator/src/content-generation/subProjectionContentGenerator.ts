import { Tree } from "@lezer/common";
import SubProjectionGenerator from "../subProjection/subProjectionGenerator";
import { ContentGenerator } from "./internal";
import { BlockVariableMap, Path } from "./context-var-detection/blockVariableMap";
import TemplateParameterArray from "./template/parameterArray";
import AstNode from "@puredit/parser/ast/node";

export default class SubProjectionContentGenerator extends ContentGenerator {
  constructor(generator: SubProjectionGenerator) {
    super(generator);
  }

  async execute(
    projectionPath: string,
    codeSamples: string[],
    codeAsts: AstNode[],
    overheadPath: Path,
    projectionSamples: string[],
    projectionTrees: Tree[],
    undeclaredVariableMap: BlockVariableMap,
    globalTemplateParameters: TemplateParameterArray,
    ignoreBlocks: boolean
  ): Promise<string[]> {
    this.projectionPath = projectionPath;
    this.ignoreBlocks = ignoreBlocks;
    this.codeSamples = codeSamples;
    this.codeAsts = codeAsts;
    this.overheadPath = overheadPath;
    this.projectionSamples = projectionSamples;
    this.projectionTrees = projectionTrees;
    this.undeclaredVariableMap = undeclaredVariableMap;
    this.globalTemplateParameters = globalTemplateParameters;

    const projectionName = await this.generator.showPrompts();
    this.assertLanguageAvailable();

    const projectionContent = await this.generateContent();
    await this.generator.writeFiles(projectionContent);
    projectionContent.allSubProjections.push(projectionName);
    return projectionContent.allSubProjections;
  }
}
