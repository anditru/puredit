import { ProjectionRegistry, RootProjection } from "@puredit/projections";
import { PackageExtension, RootProjectionDefinition } from "./types";
import { Parser, Pattern } from "@puredit/parser";
import { buildParserInput, buildWidget } from "./common";
import ExtensionCompiler from "./extensionCompiler";

export default class PackageExtensionCompiler extends ExtensionCompiler {
  constructor(parser: Parser, private readonly projectionRegistry: ProjectionRegistry) {
    super(parser);
  }

  compile(extension: PackageExtension) {
    for (const definition of extension.rootProjections) {
      const rootProjection = this.buildRootProjection(definition);
      this.projectionRegistry.insertRootProjection(extension.package, rootProjection);
    }
  }

  private buildRootProjection(definition: RootProjectionDefinition): RootProjection {
    const { paramsMap, subProjections } = this.buildParams(definition);
    const { templateStrings, params } = buildParserInput(definition, paramsMap);

    let pattern: Pattern;
    if (definition.isExpression) {
      pattern = this.parser.expressionPattern(definition.name)(
        templateStrings as unknown as TemplateStringsArray,
        ...params
      );
    } else {
      pattern = this.parser.statementPattern(definition.name)(
        templateStrings as unknown as TemplateStringsArray,
        ...params
      );
    }

    const segmentWidgets = definition.segmentWidgets.map((widget) =>
      buildWidget(widget, paramsMap)
    );

    return {
      pattern,
      description: definition.description,
      segmentWidgets,
      requiredContextVariables: [],
      subProjections,
    };
  }
}
