import languageConfigs from "./languageConfigs";
import {
  AggregatableNodeTypeConfig,
  AggregationsConfig,
  ArgumentsConfig,
  BlocksConfig,
  ChainableNodeTypeConfig,
  ChainsConfig,
  CommentsConfig,
  Language,
  NodeTypesToSplitConfig,
} from "./types";

export function loadArgumentsConfigFor(language: Language): ArgumentsConfig {
  return languageConfigs[language].arguments;
}

export function loadAggregatableNodeTypes(): string[] {
  const languages = Object.values(Language) as Language[];
  return languages.flatMap((language: Language) =>
    Object.keys(languageConfigs[language].aggregations.aggregatableNodeTypes)
  );
}

export function loadAggregatableNodeTypesFor(language: Language): string[] {
  return Object.keys(languageConfigs[language].aggregations.aggregatableNodeTypes);
}

export function loadAggregationsConfigFor(language: Language): AggregationsConfig {
  return languageConfigs[language].aggregations;
}

export function loadAggregationDelimiterTokensFor(language: Language): string[] {
  const aggregationsConfig = loadAggregationsConfigFor(language);
  return Object.values(aggregationsConfig.aggregatableNodeTypes).map(
    (aggregatableNodeTypeConfig) => aggregatableNodeTypeConfig.delimiterToken
  );
}

export function loadAggregatableNodeTypeConfigFor(
  language: Language,
  nodeType: string
): AggregatableNodeTypeConfig {
  return languageConfigs[language].aggregations.aggregatableNodeTypes[nodeType];
}

export function loadChainsConfigFor(language: Language): ChainsConfig {
  return languageConfigs[language].chains;
}

export function loadChainableNodeTypeConfigFor(
  language: Language,
  nodeType: string
): ChainableNodeTypeConfig {
  return languageConfigs[language].chains.chainableNodeTypes[nodeType];
}

export function loadChainableNodeTypesFor(language: Language): string[] {
  return Object.keys(languageConfigs[language].chains.chainableNodeTypes);
}

export function loadBlocksConfigFor(language: Language): BlocksConfig {
  return languageConfigs[language].blocks;
}

export function loadCommentsConfigFor(language: Language): CommentsConfig {
  return languageConfigs[language].comments;
}

export function loadNodeTypesToSplitFor(language: Language): NodeTypesToSplitConfig {
  return languageConfigs[language].nodeTypesToSplit;
}

export function loadLookAheadPathFor(language: Language, nodeType: string) {
  return languageConfigs[language].lookAheadPaths[nodeType];
}
