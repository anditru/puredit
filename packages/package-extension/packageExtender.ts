import { RootProjection, SubProjection } from "@puredit/projections";
import { ProjectionExtension, SubProjectionDefinition } from "./types";
import { arg, Parser, Pattern } from "@puredit/parser";
import { simpleProjection } from "@puredit/simple-projection";
import ChainDecorator from "@puredit/parser/pattern/decorators/chainDecorator";
import ChainLinkTemplateTransformation from "@puredit/parser/parse/chainLinkTemplateTransformation";
import TemplateParameter from "@puredit/parser/template/parameters/templateParameter";
import TemplatePartArray from "./templatePartArray";

const PLACEHOLDER_PATTERN = /<%[^%>]+%>/g;

export class PackageExtender {
  constructor(private readonly parser: Parser) {}

  extendPackage(pkg: RootProjection[], extensions: ProjectionExtension[]) {
    for (const extension of extensions) {
      extension.subProjections.forEach((definition) => {
        const subProjection = this.buildSubProjection(definition);
        const rootProjection = pkg.find((proj) => proj.name === extension.projection);
        if (!rootProjection) {
          throw new Error(`Root projection ${rootProjection} not found`);
        }
        const pattern = this.buildChainLinkPattern(
          subProjection,
          rootProjection,
          extension.parentParameter
        );
        insertChainLinkProjection(
          subProjection,
          pattern,
          rootProjection,
          extension.parentParameter
        );
      });
    }
    return pkg;
  }

  private buildSubProjection(definition: SubProjectionDefinition): SubProjection {
    const technicalName = toLowerCamelCase(definition.name);
    const paramsMap: Record<string, TemplateParameter> = {};
    definition.arguments.map((definition) => {
      paramsMap[`<%${definition.name}%>`] = arg(definition.name, definition.types);
    });

    const patternStaticParts = definition.template.split(PLACEHOLDER_PATTERN);
    const patternParameters = definition.template.match(PLACEHOLDER_PATTERN) || [];
    const params = patternParameters.map((param) => paramsMap[param]);
    const templateStrings = new TemplatePartArray(...patternStaticParts);
    const template = this.parser.subPattern(`${technicalName}Pattern`)(
      templateStrings as unknown as TemplateStringsArray,
      ...params
    );

    const projectionStaticParts = definition.projection.split(PLACEHOLDER_PATTERN);
    const projectionParameters = definition.projection.match(PLACEHOLDER_PATTERN) || [];
    const mergedParts = merge(projectionStaticParts, projectionParameters, paramsMap);
    const widget = simpleProjection(mergedParts);
    return {
      name: definition.name,
      description: definition.description,
      pattern: template,
      segmentWidgets: [widget],
      requiredContextVariables: [],
    };
  }

  private buildChainLinkPattern(
    subProjection: SubProjection,
    rootProjection: RootProjection,
    parentParameter: string
  ): Pattern {
    const rootPattern = rootProjection.pattern as ChainDecorator;
    const chain = rootPattern.getChain(parentParameter);
    if (!chain) {
      throw new Error(`Chain with name ${parentParameter} not found`);
    }
    const transformation = new ChainLinkTemplateTransformation(this.parser.treeSitterParser);
    return transformation
      .setTemplateChain(chain)
      .setStartPatternRootNode(rootPattern.getStartPatternFor(parentParameter).rootNode)
      .setIsExpression(false)
      .setTemplate(subProjection.pattern)
      .execute();
  }
}

function insertChainLinkProjection(
  subProjection: SubProjection,
  linkPattern: Pattern,
  rootProjection: RootProjection,
  parentParameter: string
) {
  rootProjection.subProjections.push(subProjection);
  const rootPattern = rootProjection.pattern as ChainDecorator;
  const chain = rootPattern.getChain(parentParameter);
  if (!chain) {
    throw new Error(`Chain with name ${parentParameter} not found`);
  }
  chain.linkPatterns.push(subProjection.pattern);
  rootPattern.addLinkPattern(parentParameter, linkPattern);
}

function toLowerCamelCase(text: string) {
  return text
    .replace(/\s(.)/g, (part) => part.toUpperCase().trim())
    .replace(/\s/g, "")
    .replace(/^(.)/, (part) => part.toLowerCase());
}

function merge(
  staticParts: string[],
  parameters: string[],
  paramsMap: Record<string, TemplateParameter>
) {
  const result: (string | TemplateParameter)[] = [];
  for (let i = 0; i < parameters.length; i++) {
    result.push(staticParts[i]);
    result.push(paramsMap[parameters[i]]);
  }
  result.push(staticParts[parameters.length]);
  return result.filter((part) => part !== "");
}
