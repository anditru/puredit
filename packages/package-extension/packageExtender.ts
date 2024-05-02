import { RootProjection, SubProjection } from "@puredit/projections";
import { ProjectionExtension, SubProjectionDefinition } from "./types";
import { arg, Parser, Pattern } from "@puredit/parser";
import { simpleProjection } from "@puredit/simple-projection";
import ChainDecorator from "@puredit/parser/pattern/decorators/chainDecorator";
import ChainLinkTemplateTransformation from "@puredit/parser/parse/chainLinkTemplateTransformation";
import TemplateParameter from "@puredit/parser/template/parameters/templateParameter";
import TemplatePartArray from "./templatePartArray";
import { toLowerCamelCase } from "@puredit/utils";
import AggregationDecorator from "@puredit/parser/pattern/decorators/aggregationDecorator";
import AggPartTemplateTransformation from "@puredit/parser/parse/aggPartTemplateTransformation";
import { loadAggregatableNodeTypeConfigFor } from "@puredit/language-config";

const PLACEHOLDER_PATTERN = /<%[^%>]+%>/g;
const ALLOWED_EXTENSION_TYPES = ["projectionExtension"].join(", ");
const ALLOWED_SUBPROJECTION_TYPES = ["chainLink, aggregationPart"].join(", ");

export class PackageExtender {
  pkg: RootProjection[];
  constructor(private readonly parser: Parser) {}

  extendPackage(pkg: RootProjection[], extensions: ProjectionExtension[]) {
    this.pkg = pkg;

    for (const extension of extensions) {
      switch (extension.type) {
        case "projectionExtension":
          this.processProjectionExtension(extension);
          break;
        default:
          throw new Error(
            `Invalid extension type ${extension.type}! Allowed values are ${ALLOWED_EXTENSION_TYPES}.`
          );
      }
    }

    return pkg;
  }

  private processProjectionExtension(extension: ProjectionExtension) {
    for (const definition of extension.subProjections) {
      switch (definition.type) {
        case "chainLink":
          this.processChainLink(extension, definition);
          break;
        case "aggregationPart":
          this.processAggregationPart(extension, definition);
          break;
        default:
          throw new Error(
            `Invalid subprojection type ${definition.type}! Allowed values are ${ALLOWED_SUBPROJECTION_TYPES}.`
          );
      }
    }
  }

  private processChainLink(extension: ProjectionExtension, definition: SubProjectionDefinition) {
    const rootProjection = this.getRootProjectionFor(extension);
    const subProjection = this.buildSubProjection(definition);
    const pattern = this.buildChainLinkPattern(
      subProjection,
      rootProjection,
      extension.parentParameter
    );
    insertChainLinkProjection(subProjection, pattern, rootProjection, extension.parentParameter);
  }

  private processAggregationPart(
    extension: ProjectionExtension,
    definition: SubProjectionDefinition
  ) {
    const rootProjection = this.getRootProjectionFor(extension);
    const subProjection = this.buildSubProjection(definition);
    const pattern = this.buildAggregationPartPattern(
      subProjection,
      rootProjection,
      extension.parentParameter
    );
    insertAggregationPartProjection(
      subProjection,
      pattern,
      rootProjection,
      extension.parentParameter
    );
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

  private buildAggregationPartPattern(
    subProjection: SubProjection,
    rootProjection: RootProjection,
    parentParameter: string
  ): Pattern {
    const rootPattern = rootProjection.pattern as AggregationDecorator;
    const aggregation = rootPattern.getAggregation(parentParameter);
    if (!aggregation) {
      throw new Error(`Aggregation with name ${parentParameter} not found`);
    }
    const nodeTypeConfig = loadAggregatableNodeTypeConfigFor(
      this.parser.language,
      aggregation.type
    );
    const transformation = new AggPartTemplateTransformation(this.parser.treeSitterParser);
    transformation;
    if (aggregation.specialStartPattern) {
      transformation.setStartTemplateCodeString(aggregation.specialStartPattern?.toCodeString());
    }
    return transformation
      .setNodeTypeConfig(nodeTypeConfig)
      .setIsExpression(false)
      .setTemplate(subProjection.pattern)
      .execute();
  }

  private getRootProjectionFor(extension: ProjectionExtension) {
    const rootProjection = this.pkg.find((proj) => proj.name === extension.projection);
    if (!rootProjection) {
      throw new Error(`Root projection ${extension.projection} not found`);
    }
    return rootProjection;
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

function insertAggregationPartProjection(
  subProjection: SubProjection,
  partPattern: Pattern,
  rootProjection: RootProjection,
  parentParameter: string
) {
  rootProjection.subProjections.push(subProjection);
  const rootPattern = rootProjection.pattern as AggregationDecorator;
  const aggregation = rootPattern.getAggregation(parentParameter);
  if (!aggregation) {
    throw new Error(`Chain with name ${parentParameter} not found`);
  }
  aggregation.subPatterns.push(subProjection.pattern);
  rootPattern.addPartPattern(parentParameter, partPattern);
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
